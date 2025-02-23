import { Container, VideoSource as PixiVideoSource, Rectangle, Sprite, Texture } from 'pixi.js';
import type { VisualClipOptionsWithoutOffsetDuration } from '../base/visual-clip';
import { VisualClip } from '../base/visual-clip';
import type { VideoSource } from '../sources/video-source';
import { ClipType, type Crop } from '../types';
import { logger } from '../utils/logger';

export type VideoClipOptions = VisualClipOptionsWithoutOffsetDuration & {
  source: VideoSource;
  offset?: number;
  duration?: number;
  speed?: number;
  range?: {
    start: number; // Start time in the source video (in seconds)
    end: number; // End time in the source video (in seconds)
  };
  crop?: Crop;
};

export class VideoClip extends VisualClip {
  private container: Container = new Container();
  private texture: Texture | null = null;
  private sprite: Sprite;
  private cropRectangle: Rectangle | null = null;
  private videoElement!: HTMLVideoElement;
  private videoSource: PixiVideoSource;
  private lastUpdateTime: number = -1;
  private pendingSeek: boolean = false;
  private speed: number = 1;
  private range: { start: number; end: number };
  private source: VideoSource;

  private seekedListener = () => {
    if (this.pendingSeek) {
      this.pendingSeek = false;
    }
  };

  // Frame preloading properties
  private frameBuffer: Map<number, Texture> = new Map();
  private bufferSize: number = 10; // Number of frames to preload
  private isPreloading: boolean = false;
  private preloadInterval: number = 1000 / 30; // Preload interval in ms (30fps)

  public ready: boolean = false;

  public getType(): ClipType {
    return ClipType.VIDEO;
  }

  constructor(options: VideoClipOptions) {
    super({
      id: options.id,
      offset: options.offset ?? 0,
      duration: options.duration ?? options.source.duration,
      position: options.position,
      size: options.size,
      track: options.track,
    });

    this.speed = options.speed ?? 1;
    this.videoElement = options.source.getVideoElement();
    this.source = options.source;

    // Initialize and validate source range
    this.range = {
      start: Math.max(0, options.range?.start ?? 0),
      end: Math.min(options.source.duration, options.range?.end ?? options.source.duration),
    };

    if (this.range.start >= this.range.end) {
      throw new Error('Invalid source range: start must be less than end');
    }

    // Prevent video from actually playing since we're manually seeking
    this.videoElement.autoplay = false;
    this.videoElement.muted = true;

    // Listen for seeked event to know when we can capture the frame
    this.videoElement.addEventListener('seeked', this.seekedListener);

    // Create PIXI video source
    this.videoSource = new PixiVideoSource({
      resource: this.videoElement,
      autoPlay: false, // We'll handle playback manually
      autoLoad: true,
      updateFPS: 0, // Update every frame
    });

    // Set initial position to range start
    this.videoElement.currentTime = this.range.start;

    // Initialize sprite with video texture
    this.sprite = new Sprite();
    if (this.size) {
      this.sprite.width = this.size.width;
      this.sprite.height = this.size.height;
    }
    if (this.position) {
      this.sprite.position.set(this.position.left, this.position.top);
    }
    this.container.addChild(this.sprite);

    // Initialize sprite with video texture
    this.texture = new Texture(this.videoSource);
    this.sprite.texture = this.texture;

    this.videoElement.addEventListener(
      'seeked',
      () => {
        // Apply initial crop if provided
        if (options.crop) {
          this.setCrop(options.crop.left, options.crop.top, options.crop.width, options.crop.height);
        }

        // Start preloading frames
        void this.preloadFrames(0);

        this.ready = true;
      },
      { once: true }
    );
  }

  private createCroppedTexture(baseTexture: Texture, rect: Rectangle): Texture {
    // Ensure crop rectangle doesn't exceed texture bounds
    const sourceWidth = baseTexture.source.width;
    const sourceHeight = baseTexture.source.height;

    const safeRect = new Rectangle(
      Math.max(0, Math.min(rect.x, sourceWidth)),
      Math.max(0, Math.min(rect.y, sourceHeight)),
      Math.min(rect.width, sourceWidth - rect.x),
      Math.min(rect.height, sourceHeight - rect.y)
    );

    return new Texture({
      source: baseTexture.source,
      frame: safeRect,
    });
  }

  public getSource(): VideoSource {
    return this.source;
  }

  public setCrop(x: number, y: number, width: number, height: number): this {
    if (!this.videoSource) {
      logger.warn('Cannot set crop: sprite or video source not loaded');
      return this;
    }

    // Validate crop dimensions
    if (width <= 0 || height <= 0) {
      logger.warn('Invalid crop dimensions: width and height must be positive');
      return this;
    }

    this.cropRectangle = new Rectangle(x, y, width, height);

    if (this.texture) {
      const croppedTexture = this.createCroppedTexture(this.texture, this.cropRectangle);
      this.texture.destroy();
      this.texture = croppedTexture;
      this.sprite.texture = this.texture;

      // Update sprite size to match requested dimensions while maintaining aspect ratio
      if (this.size) {
        this.sprite.width = this.size.width;
        this.sprite.height = this.size.height;
      } else {
        // If no dimensions specified, use crop dimensions
        this.sprite.width = width;
        this.sprite.height = height;
      }
    }
    return this;
  }

  public removeCrop(): this {
    if (!this.sprite || !this.videoSource) {
      logger.warn('Cannot remove crop: sprite or video source not loaded');
      return this;
    }

    this.cropRectangle = null;
    if (this.texture) {
      const fullTexture = new Texture(this.videoSource);
      this.texture.destroy();
      this.texture = fullTexture;
      this.sprite.texture = this.texture;

      // Reset sprite size to requested dimensions
      if (this.size) {
        this.sprite.width = this.size.width;
        this.sprite.height = this.size.height;
      } else {
        // If no dimensions specified, use video source dimensions
        this.sprite.width = this.videoSource.width;
        this.sprite.height = this.videoSource.height;
      }
    }
    return this;
  }

  public setSize(width: number, height: number) {
    if (this.sprite) {
      this.sprite.width = width;
      this.sprite.height = height;
    }
    super.setSize(width, height);
    return this;
  }

  public setPosition(left: number, top: number) {
    if (this.sprite) {
      this.sprite.position.set(left, top);
    }
    super.setPosition(left, top);
    return this;
  }

  public _getContainer(): Container {
    return this.container;
  }

  private mapToSourceTime(clipTime: number): number {
    // clipTime is relative to the clip's start time (0 = clip start)
    // We need to map this to the video's range
    const rangeDuration = this.range.end - this.range.start;
    const normalizedTime = (clipTime * this.speed) % rangeDuration;
    return this.range.start + (normalizedTime >= 0 ? normalizedTime : rangeDuration + normalizedTime);
  }

  private async preloadFrames(startTime: number): Promise<void> {
    if (this.isPreloading) {
      return;
    }
    this.isPreloading = true;

    try {
      for (let iter = 0; iter < this.bufferSize; iter++) {
        const frameTime = startTime + (iter * this.preloadInterval) / 1000;

        // Stop preloading if we're beyond the clip duration
        if (frameTime > this.duration) {
          break;
        }

        if (!this.frameBuffer.has(frameTime)) {
          const temporaryVideo = this.videoElement.cloneNode() as HTMLVideoElement;
          const sourceTime = this.mapToSourceTime(frameTime);
          temporaryVideo.currentTime = sourceTime;

          await new Promise<void>((resolve) => {
            temporaryVideo.addEventListener(
              'seeked',
              () => {
                if (this.videoSource) {
                  const baseTexture = new Texture(
                    new PixiVideoSource({
                      resource: temporaryVideo,
                      autoPlay: false,
                      autoLoad: true,
                      updateFPS: 0,
                    })
                  );

                  if (this.cropRectangle) {
                    const croppedTexture = this.createCroppedTexture(baseTexture, this.cropRectangle);
                    baseTexture.destroy();
                    this.frameBuffer.set(frameTime, croppedTexture);
                  } else {
                    // Create a new texture that covers the full video frame
                    const fullTexture = new Texture({
                      source: baseTexture.source,
                      frame: new Rectangle(0, 0, baseTexture.source.width, baseTexture.source.height),
                    });
                    baseTexture.destroy();
                    this.frameBuffer.set(frameTime, fullTexture);
                  }
                }
                temporaryVideo.remove();
                resolve();
              },
              { once: true }
            );
          });
        }
      }
    } finally {
      this.isPreloading = false;
    }
  }

  public render(time: number): void {
    const clipTime = time - this.offset;
    if (clipTime >= 0 && clipTime <= this.duration) {
      this.container.visible = true;

      // Try to use preloaded frame
      const nearestFrame = this.findNearestFrame(clipTime);
      if (nearestFrame !== null && this.frameBuffer.has(nearestFrame)) {
        const frameTexture = this.frameBuffer.get(nearestFrame)!;
        if (this.sprite.texture !== frameTexture) {
          this.sprite.texture = frameTexture;
        }
      } else if (this.lastUpdateTime !== clipTime && !this.pendingSeek) {
        this.pendingSeek = true;
        // Map clip time to source video time
        const sourceTime = this.mapToSourceTime(clipTime);
        this.videoElement.currentTime = sourceTime;
        this.lastUpdateTime = clipTime;
      }

      // Trigger preloading of next frames
      void this.preloadFrames(clipTime + this.preloadInterval / 1000);
    } else {
      this.container.visible = false;
      this.lastUpdateTime = -1;
      this.pendingSeek = false;
    }
  }

  private findNearestFrame(time: number): number | null {
    let nearest = null;
    let minDiff = Infinity;

    for (const frameTime of this.frameBuffer.keys()) {
      const diff = Math.abs(frameTime - time);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = frameTime;
      }
    }

    // Only use frame if it's within our interval threshold
    return minDiff <= this.preloadInterval / 1000 ? nearest : null;
  }

  public remove(): void {
    // Call parent's remove method
    super.remove();
  }

  public destroy(): void {
    // Clear frame buffer
    for (const texture of this.frameBuffer.values()) {
      texture.destroy();
    }
    this.frameBuffer.clear();

    this.videoElement.removeEventListener('seeked', this.seekedListener);
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.texture) {
      this.texture.destroy();
    }
    if (this.videoSource) {
      this.videoSource.destroy();
    }
    this.container.destroy();
  }
}
