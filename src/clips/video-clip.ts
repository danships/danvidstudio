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
    this.videoElement.addEventListener('seeked', () => {
      if (this.pendingSeek) {
        this.pendingSeek = false;
      }
    });

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

      // Only update if the time has changed and we're not already seeking
      if (this.lastUpdateTime !== adjustedClipTime && !this.pendingSeek) {
        this.pendingSeek = true;
        this.videoElement.currentTime = adjustedClipTime;
        this.lastUpdateTime = adjustedClipTime;
      }
    } else {
      this.container.visible = false;
      this.lastUpdateTime = -1;
      this.pendingSeek = false;
    }
  }

  public destroy(): void {
    this.videoElement.removeEventListener('seeked', () => {});
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
