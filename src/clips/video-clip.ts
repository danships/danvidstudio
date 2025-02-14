import { Container, Rectangle, Sprite, Texture, SCALE_MODES, VideoSource as PixiVideoSource } from 'pixi.js';
import { VisualClip, type VisualOptions } from '../base/visual-clip';
import { VideoSource } from '../sources/video-source';
import { logger } from '../utils/logger';

export type Options = VisualOptions & {
  source: VideoSource;
  speed?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export class VideoClip extends VisualClip {
  private container: Container = new Container();
  private texture: Texture | null = null;
  private sprite: Sprite | null = null;
  private cropRectangle: Rectangle | null = null;
  private videoElement!: HTMLVideoElement;
  private videoSource: PixiVideoSource | null = null;
  private lastUpdateTime: number = -1;
  private pendingSeek: boolean = false;
  private speed: number = 1;
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

  constructor(options: Options) {
    super({
      id: options.id,
      start: options.start,
      end: options.end,
      top: options.top,
      left: options.left,
      width: options.width,
      height: options.height,
      track: options.track,
    });

    this.speed = options.speed ?? 1;
    this.videoElement = options.source.getVideoElement();
    // Prevent video from actually playing since we're manually seeking
    this.videoElement.autoplay = false;
    this.videoElement.muted = true;

    // Listen for seeked event to know when we can capture the frame
    this.videoElement.addEventListener('seeked', this.seekedListener);

    if (!options.width) {
      this.width = options.crop ? options.crop.width : options.source.width;
    }
    if (!options.height) {
      this.height = options.crop ? options.crop.height : options.source.height;
    }

    // Create PIXI video source
    this.videoSource = new PixiVideoSource({
      resource: this.videoElement,
      autoPlay: false, // We'll handle playback manually
      autoLoad: true,
      updateFPS: 0, // Update every frame
    });

    // Initialize sprite with video texture
    this.texture = new Texture(this.videoSource);
    this.sprite = new Sprite(this.texture);
    this.sprite.width = this.width;
    this.sprite.height = this.height;
    this.sprite.position.set(this.left, this.top);
    this.container.addChild(this.sprite);

    // Apply initial crop if provided
    if (options.crop) {
      this.setCrop(options.crop.x, options.crop.y, options.crop.width, options.crop.height);
    }

    // Start preloading frames
    void this.preloadFrames(0);

    this.ready = true;
  }

  private createCroppedTexture(rect: Rectangle): Texture {
    if (!this.videoSource) {
      throw new Error('Video source not initialized');
    }
    return new Texture({
      source: this.videoSource,
      frame: new Rectangle(rect.x, rect.y, rect.width, rect.height),
    });
  }

  public setCrop(x: number, y: number, width: number, height: number): this {
    if (!this.sprite || !this.videoSource) {
      logger.warn('Cannot set crop: sprite or video source not loaded');
      return this;
    }

    this.cropRectangle = new Rectangle(x, y, width, height);
    const croppedTexture = this.createCroppedTexture(this.cropRectangle);

    if (this.texture) {
      this.texture.destroy();
    }
    this.texture = croppedTexture;
    this.sprite.texture = this.texture;
    return this;
  }

  public removeCrop(): this {
    if (!this.sprite || !this.videoSource) {
      logger.warn('Cannot remove crop: sprite or video source not loaded');
      return this;
    }

    if (this.texture) {
      this.texture.destroy();
    }
    this.texture = new Texture(this.videoSource);
    this.sprite.texture = this.texture;
    this.cropRectangle = null;
    return this;
  }

  public setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    if (this.sprite) {
      this.sprite.width = width;
      this.sprite.height = height;
    }
    return this;
  }

  public setPosition(top: number, left: number) {
    this.top = top;
    this.left = left;
    if (this.sprite) {
      this.sprite.position.set(left, top);
    }
    return this;
  }

  public _getContainer(): Container {
    return this.container;
  }

  private async preloadFrames(startTime: number): Promise<void> {
    if (this.isPreloading) return;
    this.isPreloading = true;

    try {
      for (let iter = 0; iter < this.bufferSize; iter++) {
        const frameTime = startTime + (iter * this.preloadInterval) / 1000;
        if (frameTime > this.end - this.start) {
          break;
        }

        if (!this.frameBuffer.has(frameTime)) {
          // Create a temporary video element for frame extraction
          const temporaryVideo = this.videoElement.cloneNode() as HTMLVideoElement;
          temporaryVideo.currentTime = frameTime * this.speed;

          await new Promise<void>((resolve) => {
            temporaryVideo.addEventListener(
              'seeked',
              () => {
                if (this.videoSource) {
                  const frameTexture = new Texture(
                    new PixiVideoSource({
                      resource: temporaryVideo,
                      autoPlay: false,
                      autoLoad: true,
                      updateFPS: 0,
                    })
                  );

                  if (this.cropRectangle) {
                    const croppedTexture = this.createCroppedTexture(
                      new Rectangle(
                        this.cropRectangle.x,
                        this.cropRectangle.y,
                        this.cropRectangle.width,
                        this.cropRectangle.height
                      )
                    );
                    this.frameBuffer.set(frameTime, croppedTexture);
                  } else {
                    this.frameBuffer.set(frameTime, frameTexture);
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
    if (!this.ready || !this.sprite) {
      logger.warn('VideoClip not loaded, skipping render');
      return;
    }

    const clipTime = time - this.start;
    if (clipTime >= 0 && clipTime <= this.end - this.start) {
      this.container.visible = true;

      // Apply speed factor to the video time
      const adjustedClipTime = clipTime * this.speed;

      // Try to use preloaded frame
      const nearestFrame = this.findNearestFrame(clipTime);
      if (nearestFrame !== null && this.frameBuffer.has(nearestFrame)) {
        const frameTexture = this.frameBuffer.get(nearestFrame)!;
        if (this.sprite.texture !== frameTexture) {
          this.sprite.texture = frameTexture;
        }
      } else {
        // Fall back to regular seeking if frame not available
        if (this.lastUpdateTime !== adjustedClipTime && !this.pendingSeek) {
          this.pendingSeek = true;
          this.videoElement.currentTime = adjustedClipTime;
          this.lastUpdateTime = adjustedClipTime;
        }
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
