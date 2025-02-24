/* eslint-disable unicorn/explicit-length-check */
import type { Ticker } from 'pixi.js';
import { Application } from 'pixi.js';
import { Scene, type SceneOptions } from './scene';
import { Track } from './track';
import type { Clip } from '../base/clip';
import { ExportManager } from '../export/export-manager';
import type { ExportOptions, ProgressCallback } from '../export/types';
import type { Size } from '../types';
import { generateUUID } from '../utils/generate-uuid';
import { getDurationOfScenes } from '../utils/get-duration-of-scenes';
import type { LogLevel } from '../utils/logger';
import { enableLogger, logger } from '../utils/logger';
import { throttleCallback } from '../utils/throttle-callback';

type CompositionOptions = {
  logLevel?: LogLevel;
  size?: {
    width: number;
    height: number;
  };
  backgroundColor?: string;
  fps?: number;
};

export type CompositionEvents = 'composition' | 'time' | 'size';
export type TimeUpdateListener = (currentTime: number, totalDuration: number) => void;
export type CompositionUpdateListener = () => void;
export type SizeUpdateListener = (width: number, height: number) => void;

export type CompositionEventMap = {
  time: TimeUpdateListener;
  composition: CompositionUpdateListener;
  size: SizeUpdateListener;
};

export class Composition {
  private app: Application;
  private scenes: Scene[] = [];
  private playerAttached = false;

  private size: Size = { width: 1920, height: 1080 };
  private fps: number = 25;
  private duration: number = 0;

  private ready: Promise<void>;
  private compositionTrack: Track | null = null;

  private playStatus: {
    isPlaying: boolean;
    currentTime: number;
    activeSceneIndex: number | null;
  } = {
    isPlaying: false,
    currentTime: 0,
    activeSceneIndex: null,
  };

  private compositionListeners: Map<string, CompositionUpdateListener> = new Map();
  private timeUpdateListeners: Map<string, TimeUpdateListener> = new Map();
  private sizeUpdateListeners: Map<string, SizeUpdateListener> = new Map();

  private onUpdateTime = (time: number) => {
    for (const listener of this.timeUpdateListeners.values()) {
      listener(time, this.duration);
    }
  };

  private onCompositionUpdate = () => {
    for (const listener of this.compositionListeners.values()) {
      listener();
    }
  };

  private onSizeUpdate = (width: number, height: number) => {
    for (const listener of this.sizeUpdateListeners.values()) {
      listener(width, height);
    }
  };

  // eslint-disable-next-line unicorn/consistent-function-scoping
  private onUpdateTimeThrottled = throttleCallback((time: number) => this.onUpdateTime(time), 100);
  // eslint-disable-next-line unicorn/consistent-function-scoping
  private onCompositionUpdateThrottled = throttleCallback(() => this.onCompositionUpdate(), 100);

  private exportManager!: ExportManager;

  private constructor(options: CompositionOptions = {}) {
    if (options.logLevel) {
      enableLogger(options.logLevel);
      logger.debug('Logger enabled with level:', options.logLevel);
      logger.info('Creating composition');
    }
    if (options.size) {
      this.size = options.size;
    }
    if (options.fps) {
      this.fps = Math.max(1, Math.min(120, options.fps)); // Clamp between 1 and 120 fps
      logger.debug('Setting FPS to:', this.fps);
    }

    const app = new Application();
    this.app = app;

    this.ready = (async () => {
      logger.debug('Initializing application', { width: this.size.width, height: this.size.height, fps: this.fps });
      await app.init({
        background: options.backgroundColor ?? '#000000',
        resolution: 1,
        width: this.size.width,
        height: this.size.height,
      });

      // Configure FPS settings on the ticker
      app.ticker.maxFPS = this.fps;
      app.ticker.add(this.update).stop(); // Stop the ticker by default

      // Initialize export manager after app is ready
      logger.debug('Creating ExportManager');
      this.exportManager = new ExportManager(this);
      logger.debug('ExportManager created successfully');
    })();

    // Catch any initialization errors
    this.ready.catch((error) => {
      logger.error('Failed to initialize composition:', error);
    });
  }

  public getSize() {
    return this.size;
  }

  public setSize(width: number, height: number) {
    this.size = { width, height };
    this.app.screen.width = this.size.width;
    this.app.screen.height = this.size.height;
    this.onSizeUpdate(this.size.width, this.size.height);
  }

  public getFps() {
    return this.fps;
  }

  public setFps(fps: number) {
    this.fps = fps;
    return this;
  }

  public static async create(options: CompositionOptions = {}) {
    const composition = new Composition(options);
    await composition.ready;
    return composition;
  }

  /**
   * One of the underlying scenes, tracks or clips has been updated.
   * This will trigger a re-render of the composition.
   */
  private updateTriggered(reason?: string) {
    if (reason) {
      logger.debug('Update triggered:', reason);
    }
    this.onUpdateTime(this.playStatus.currentTime);
    if (this.playerAttached) {
      this.render(); // Position every container correctly again
      this.app.render();
    }
  }

  public createScene(options: Omit<SceneOptions, 'updated'>) {
    const scene = new Scene(
      {
        composition: this,
        updateDuration: (oldDuration, newDuration) => {
          this.duration -= oldDuration;
          this.duration += newDuration;
          logger.debug('Duration updated to:', this.duration);
          this.updateTriggered();
          this.onCompositionUpdateThrottled();
        },
        setContainer: (container) => {
          this.app.stage.addChild(container);
          this.updateTriggered();
          this.onCompositionUpdateThrottled();
        },
      },
      {
        ...options,
        updated: (reason?: string) => {
          this.updateTriggered(reason);
          this.onCompositionUpdateThrottled();
        },
      }
    );
    scene.setVisible(false);
    this.scenes.push(scene);
    logger.info('Added scene', scene.id);
    this.seek(0); // We seek so that the first scene is visible in the player
    this.onCompositionUpdateThrottled();
    return scene;
  }

  public removeScene(scene: Scene) {
    const index = this.scenes.indexOf(scene);
    if (index === -1) {
      logger.warn('Scene not found in composition:', scene.id);
      return;
    }

    // Remove duration of the scene from total duration
    this.duration -= scene.getDuration();

    // Remove from scenes array
    this.scenes.splice(index, 1);

    // Clean up the scene
    scene.destroy();

    // If we removed the active scene, update playback state
    if (this.playStatus.activeSceneIndex === index) {
      this.playStatus.activeSceneIndex = null;
    } else if (this.playStatus.activeSceneIndex !== null && this.playStatus.activeSceneIndex > index) {
      // Adjust active scene index if we removed a scene before it
      this.playStatus.activeSceneIndex--;
    }

    logger.info('Removed scene', scene.id);
    this.updateTriggered('Scene removed');
    this.onCompositionUpdateThrottled();
  }

  public attachPlayer(element: HTMLDivElement) {
    element.append(this.app.canvas);
    this.playerAttached = true;
  }

  public detachPlayer() {
    logger.debug('Detaching player and destroying application');
    this.app.canvas.remove();
    this.playerAttached = false;
  }

  public play() {
    this.app.ticker.start();
    this.playStatus.isPlaying = true;
    this.onUpdateTime(this.playStatus.currentTime);
  }

  public pause() {
    this.app.ticker.stop();
    this.playStatus.isPlaying = false;
    this.onUpdateTime(this.playStatus.currentTime);
  }

  public seek(time: number) {
    logger.info('Seeking to:', time);
    this.playStatus.currentTime = time;
    this.onUpdateTime(this.playStatus.currentTime);

    const wasRunning = this.playStatus.isPlaying;
    if (wasRunning) {
      logger.debug('Temporarily stopping playback when seeking.');
      this.app.ticker.stop();
    }

    // Activate that is active at that time
    let sceneTimeBefore = 0;
    for (const [index, scene] of this.scenes.entries()) {
      if (time >= sceneTimeBefore && time <= sceneTimeBefore + scene.getDuration()) {
        logger.debug('Scene is active after seek', index, scene.id);

        scene.render(time - sceneTimeBefore);
        scene.setVisible(true);
        this.playStatus.activeSceneIndex = index;
      } else {
        scene.setVisible(false);
      }
      sceneTimeBefore += scene.getDuration();
    }

    this.app.render();
    if (wasRunning) {
      logger.debug('Resuming playback');
      this.app.ticker.start();
    }
  }

  public on<T extends CompositionEvents>(event: T, listener: CompositionEventMap[T]): string {
    const id = generateUUID();

    switch (event) {
      case 'time': {
        this.timeUpdateListeners.set(id, listener as TimeUpdateListener);
        break;
      }
      case 'composition': {
        this.compositionListeners.set(id, listener as CompositionUpdateListener);

        break;
      }
      case 'size': {
        this.sizeUpdateListeners.set(id, listener as SizeUpdateListener);
        // Immediately notify of current size
        listener(this.size.width, this.size.height);

        break;
      }
      // No default
    }

    return id;
  }

  public off(event: CompositionEvents, id: string): void {
    switch (event) {
      case 'time': {
        this.timeUpdateListeners.delete(id);

        break;
      }
      case 'composition': {
        this.compositionListeners.delete(id);

        break;
      }
      case 'size': {
        this.sizeUpdateListeners.delete(id);

        break;
      }
      // No default
    }
  }

  private update = (time: Ticker) => {
    if (this.scenes.length === 0) {
      logger.warn('No scenes to render, skipping.');
      return;
    }

    this.playStatus.currentTime += time.deltaTime / 60;
    logger.verbose('Current time:', this.playStatus.currentTime);
    this.onUpdateTimeThrottled(this.playStatus.currentTime);

    this.render();
  };

  private render() {
    if (this.scenes.length === 0) {
      logger.warn('No scenes to render, skipping.');
      return;
    }

    // Initialize active scene if not set
    if (this.playStatus.activeSceneIndex === null) {
      logger.debug('Initializing active scene index to 0', {
        id: this.scenes[0]?.id,
        duration: this.scenes[0]?.getDuration(),
      });
      this.playStatus.activeSceneIndex = 0;
      this.scenes[this.playStatus.activeSceneIndex]?.setVisible(true);
    }

    // Check if we've reached the end of the composition
    if (this.playStatus.currentTime >= this.duration) {
      logger.debug('Reached end of composition, pausing.');
      this.playStatus.currentTime = this.duration;
      this.pause();
      return;
    }

    // Using the activeSceneIndex, determine how many time already elapsed before the current scene
    let sceneTimeElapsed =
      this.playStatus.activeSceneIndex > 0
        ? getDurationOfScenes(this.scenes.slice(0, this.playStatus.activeSceneIndex))
        : 0;

    if (
      this.playStatus.currentTime >
      sceneTimeElapsed + (this.scenes[this.playStatus.activeSceneIndex]?.getDuration() ?? 0)
    ) {
      this.playStatus.activeSceneIndex = this.playStatus.activeSceneIndex + 1;
      if (!this.scenes[this.playStatus.activeSceneIndex]) {
        logger.debug('Reached end of composition, no more scenes to play, pausing.');
        this.pause();
        return;
      }

      logger.debug('Reached end of scene, moving to next scene', {
        time: this.playStatus.currentTime,
        nextSceneIndex: this.playStatus.activeSceneIndex,
        nextSceneDuration: this.scenes[this.playStatus.activeSceneIndex]?.getDuration(),
      });

      // Add the timing of the previous scene to the sceneTimeElapsed
      sceneTimeElapsed += this.scenes[this.playStatus.activeSceneIndex - 1]?.getDuration() ?? 0;

      // Update scene visibility
      this.scenes[this.playStatus.activeSceneIndex - 1]?.setVisible(false); // out with the old
      this.scenes[this.playStatus.activeSceneIndex]?.setVisible(true); // in with the new
    }

    this.scenes[this.playStatus.activeSceneIndex]?.render(this.playStatus.currentTime - sceneTimeElapsed);
    this.compositionTrack?.render(this.playStatus.currentTime);
  }

  public async export(options: ExportOptions, onProgress?: ProgressCallback): Promise<Blob> {
    try {
      logger.debug('Starting export');
      await this.ready;
      if (!this.exportManager) {
        throw new Error('Export manager not initialized');
      }
      logger.debug('Export manager ready, starting export');
      return await this.exportManager.export(options, this.app.stage, onProgress);
    } catch (error) {
      logger.error('Export failed:', error);
      throw error;
    }
  }

  public destroy() {
    logger.debug('Destroying composition');
    // Destroy all scenes first
    for (const scene of this.scenes) {
      scene.destroy();
    }
    this.scenes = [];

    this.detachPlayer();
    this.app.destroy();
    this.timeUpdateListeners.clear();
  }

  public getScenes() {
    return this.scenes;
  }

  public getDuration() {
    return this.duration;
  }

  public waitForReady(): Promise<void> {
    return this.ready;
  }

  /**
   * Creates a new scene and adds the clip to it
   * @returns The newly created scene containing the clip
   */
  public addClipWithScene(clip: Clip, sceneDuration: number): Scene {
    const scene = this.createScene({ duration: sceneDuration });
    scene.addClip(clip);
    return scene;
  }

  /**
   * Adds a clip to the composition-wide track that spans the entire duration
   * @returns The added clip
   */
  public addClipToComposition(clip: Clip): this {
    if (!this.compositionTrack) {
      this.compositionTrack = new Track(this.app.stage, { updated: () => this.updateTriggered() });
    }
    this.compositionTrack.addClip(clip);
    return this;
  }

  public getCompositionTrack() {
    return this.compositionTrack;
  }

  public setSceneDisplayOrder(scene: Scene, displayOrder: number) {
    this.app.stage.setChildIndex(scene._getContainer(), displayOrder);
    this.updateTriggered();
    return this;
  }

  public getCurrentTime() {
    return this.playStatus.currentTime;
  }

  public isPlaying() {
    return this.playStatus.isPlaying;
  }
}
