import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { VisualClip, type VisualOptions } from '../base/visual-clip';
import type { ImageSource } from '../sources/image-source';
import type { Position, Size } from '../types';
import { logger } from '../utils/logger';

export type ImageClipOptions = VisualOptions & {
  source: ImageSource;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export class ImageClip extends VisualClip {
  private container: Container;
  private texture: Texture | null = null;
  private sprite: Sprite;
  private cropRectangle: Rectangle | null = null;

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
      start: options.start,
      end: options.end,
      position: options.position,
      size: options.size,
      track: options.track,
    });
    this.texture = options.source._texture;

    if (options.crop) {
      this.cropRectangle = new Rectangle(options.crop.x, options.crop.y, options.crop.width, options.crop.height);
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

  public setCrop(x: number, y: number, width: number, height: number): this {
    if (!this.texture) {
      logger.warn('Cannot set crop: texture or sprite not loaded');
      return this;
    }

    this.cropRectangle = new Rectangle(x, y, width, height);
    const croppedTexture = this.createCroppedTexture(this.texture, this.cropRectangle);
    this.sprite.texture = croppedTexture;
    this.setSize({ width: croppedTexture.width, height: croppedTexture.height });
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
    this.setSize({ width: this.texture.width, height: this.texture.height });
    return this;
  }

  public setSize(size: Size) {
    this.size = size;
    if (this.sprite) {
      this.sprite.setSize(size.width, size.height);
      this.triggerUpdated('Size changed');
    }
    return this;
  }

  public setPosition(position: Position) {
    this.position = position;
    if (this.sprite) {
      this.sprite.position.set(position.left, position.top);
      this.triggerUpdated('Position changed');
    }
    return this;
  }

  public _getContainer(): Container {
    return this.container;
  }

  public render(time: number): void {
    this.container.visible = this.start <= time && this.end >= time;
  }
}
