import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { VisualClip, type VisualClipOptionsWithoutOffsetDuration } from '../base/visual-clip';
import type { ImageSource } from '../sources/image-source';
import { ClipType, type Crop } from '../types';
import { logger } from '../utils/logger';

export type ImageClipOptions = VisualClipOptionsWithoutOffsetDuration & {
  source: ImageSource;
  crop?: Crop;
  offset?: number;
  duration: number;
};

export class ImageClip extends VisualClip {
  private container: Container;
  private texture: Texture | null = null;
  private sprite: Sprite;
  private cropRectangle: Rectangle | null = null;
  private source: ImageSource;

  private createCroppedTexture(texture: Texture, rect: Rectangle): Texture {
    const croppedTexture = new Texture({
      source: texture.source,
      frame: new Rectangle(rect.x, rect.y, rect.width, rect.height),
    });
    return croppedTexture;
  }

  constructor(options: ImageClipOptions) {
    super({
      id: options.id,
      offset: options.offset ?? 0,
      duration: options.duration,
      position: options.position,
      size: options.size,
      track: options.track,
    });
    this.source = options.source;
    this.texture = options.source._texture;

    if (options.crop) {
      this.cropRectangle = new Rectangle(options.crop.left, options.crop.top, options.crop.width, options.crop.height);
    }

    this.container = new Container();
    this.sprite = new Sprite({
      label: this.id,
      texture: this.cropRectangle
        ? this.createCroppedTexture(options.source._texture, this.cropRectangle)
        : options.source._texture,
    });
    this.container.addChild(this.sprite);

    if (options.size) {
      this.sprite.setSize(options.size.width, options.size.height);
    }
    if (options.position) {
      this.sprite.position.set(options.position.left, options.position.top);
    }
  }

  public getSource(): ImageSource {
    return this.source;
  }

  public setCrop(x: number, y: number, width: number, height: number): this {
    if (!this.texture) {
      logger.warn('Cannot set crop: texture or sprite not loaded');
      return this;
    }

    this.cropRectangle = new Rectangle(x, y, width, height);
    const croppedTexture = this.createCroppedTexture(this.texture, this.cropRectangle);
    this.sprite.texture = croppedTexture;
    this.setSize(croppedTexture.width, croppedTexture.height);
    this.triggerUpdated('crop set');
    return this;
  }

  public removeCrop(): this {
    if (!this.texture || !this.sprite) {
      logger.warn('Cannot remove crop: texture or sprite not loaded');
      return this;
    }

    this.cropRectangle = null;
    this.sprite.texture = this.texture;
    this.setSize(this.texture.width, this.texture.height);
    return this;
  }

  public setSize(width: number, height: number) {
    this.size = { width, height };
    if (this.sprite) {
      this.sprite.setSize(width, height);
      this.triggerUpdated('Size changed');
    }
    return this;
  }

  public setPosition(left: number, top: number) {
    this.position = { left, top };
    if (this.sprite) {
      this.sprite.position.set(left, top);
      this.triggerUpdated('Position changed');
    }
    return this;
  }

  public _getContainer(): Container {
    return this.container;
  }

  public render(time: number): void {
    const clipTime = time - this.offset;
    this.container.visible = clipTime >= 0 && clipTime <= this.duration;
  }

  public getType(): ClipType {
    return ClipType.IMAGE;
  }

  public destroy(): void {
    if (this.sprite) {
      if (this.cropRectangle) {
        this.sprite.texture.destroy();
      }
      this.sprite.destroy();
    }

    this.texture = null;

    this.container.destroy({ children: true });
  }
}
