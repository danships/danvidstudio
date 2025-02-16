import { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Composition } from './composition';
import type { SceneOptions } from './scene';

// Mock Scene class
vi.mock('./scene', () => {
  return {
    Scene: class MockScene {
      private duration: number;
      public id: string = 'mock-scene';
      private container: Container;
      private updateDurationCallback: (oldDuration: number, newDuration: number) => void;

      constructor(
        context: {
          updateDuration: (oldDuration: number, newDuration: number) => void;
        },
        options: SceneOptions
      ) {
        this.duration = options.duration || 0;
        this.container = new Container();
        this.updateDurationCallback = context.updateDuration;
        // Call updateDuration with initial duration
        this.updateDurationCallback(0, this.duration);
      }

      public getDuration() {
        return this.duration;
      }

      public render = vi.fn();
      public setVisible(visible: boolean) {
        this.container.visible = visible;
      }
    },
  };
});

describe('Composition', () => {
  let composition: Composition;

  beforeEach(() => {
    composition = new Composition({
      size: { width: 1920, height: 1080 },
      fps: 30,
    });
  });

  describe('initialization', () => {
    it('should create a composition with default values', () => {
      const defaultComposition = new Composition();
      expect(defaultComposition.width).toBe(1920);
      expect(defaultComposition.height).toBe(1080);
      expect(defaultComposition.fps).toBe(25);
    });

    it('should create a composition with custom values', () => {
      expect(composition.width).toBe(1920);
      expect(composition.height).toBe(1080);
      expect(composition.fps).toBe(30);
    });
  });

  describe('scene management', () => {
    it('should add a scene correctly', async () => {
      await composition.ready;
      const sceneOptions: SceneOptions = {
        duration: 5,
      };

      const scene = composition.createScene(sceneOptions);

      expect(scene).toBeDefined();
      expect(scene.getDuration()).toBe(5);
    });

    it('should update composition duration when adding scenes', async () => {
      await composition.ready;

      composition.createScene({ duration: 5 });
      expect(composition.duration).toBe(5);

      composition.createScene({ duration: 3 });
      expect(composition.duration).toBe(8);
    });
  });

  describe('playback control', () => {
    it('should handle play/pause state correctly', async () => {
      await composition.ready;

      composition.play();
      expect(composition['playStatus'].isPlaying).toBe(true);

      composition.pause();
      expect(composition['playStatus'].isPlaying).toBe(false);
    });

    it('should seek to correct time', async () => {
      await composition.ready;
      composition.createScene({ duration: 5 });
      composition.createScene({ duration: 5 });

      composition.seek(7); // Seek to second scene

      expect(composition['playStatus'].currentTime).toBe(7);
      // We can't test container.visible directly as it's private, but we can verify the seek behavior
      // through the composition's state
      expect(composition['playStatus'].activeSceneIndex).toBe(1); // Second scene should be active
    });
  });

  describe('time update events', () => {
    it('should notify listeners of time updates and handle removal correctly', async () => {
      await composition.ready;
      const listener = vi.fn();

      composition.createScene({ duration: 5 }); // Add a scene to have non-zero duration

      const id = composition.onTimeUpdate(listener);
      listener.mockClear(); // Clear initial calls

      // First seek should notify the listener
      composition.seek(2);
      expect(listener).toHaveBeenLastCalledWith(2, 5);

      // Remove the listener
      composition.offTimeUpdate(id);
      listener.mockClear();

      // Add a new listener to verify the first one was truly removed
      const newListener = vi.fn();
      composition.onTimeUpdate(newListener);

      // Second seek should only notify the new listener
      composition.seek(3);
      expect(listener).not.toHaveBeenCalled();
      expect(newListener).toHaveBeenCalledWith(3, 5);
    });
  });
});
