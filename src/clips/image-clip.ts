import { Assets, Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { VisualClip, type VisualOptions } from '../base/visual-clip';
import type { ImageSource } from '../sources/image-source';
import { logger } from '../utils/logger';

export type Options = VisualOptions & {
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
  private sprite: Sprite | null = null;
  private cropRectangle: Rectangle | null = null;

  public ready: boolean = false;

  private async blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result as string));
      reader.addEventListener('error', reject);
      reader.readAsDataURL(blob);
    });
  }

  private createCroppedTexture(texture: Texture, rect: Rectangle): Texture {
    const croppedTexture = new Texture({
      source: texture.source,
      frame: new Rectangle(rect.x, rect.y, rect.width, rect.height),
    });
    return croppedTexture;
  }

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

    if (!options.width) {
      this.width = options.crop ? options.crop.width : options.source.width;
    }
    if (!options.height) {
      this.height = options.crop ? options.crop.height : options.source.height;
    }

    if (options.crop) {
      this.cropRectangle = new Rectangle(options.crop.x, options.crop.y, options.crop.width, options.crop.height);
    }

    const container = new Container();
    this.container = container;

    (async () => {
      const dataUrl = await this.blobToDataURL(options.source.blob);
      this.texture = await Assets.load(dataUrl);

      if (this.cropRectangle && this.texture) {
        const croppedTexture = this.createCroppedTexture(this.texture, this.cropRectangle);
        this.sprite = new Sprite({
          texture: croppedTexture,
          label: this.id,
        });
        this.sprite.setSize(this.width, this.height);
      } else if (this.texture) {
        this.sprite = new Sprite({ texture: this.texture, label: this.id });
        this.sprite.setSize(this.width, this.height);
      }

      if (this.sprite) {
        const xOffset = this.cropRectangle ? 0 : 0;
        const yOffset = this.cropRectangle ? 0 : 0;
        this.sprite.position.set(this.left + xOffset, this.top + yOffset);
        this.ready = true;
        container.addChild(this.sprite);
      }
    })();
  }

  public setCrop(x: number, y: number, width: number, height: number): this {
    if (!this.texture || !this.sprite) {
      logger.warn('Cannot set crop: texture or sprite not loaded');
      return this;
    }

    this.cropRectangle = new Rectangle(x, y, width, height);
    const croppedTexture = this.createCroppedTexture(this.texture, this.cropRectangle);
    this.sprite.texture = croppedTexture;
    this.setSize(croppedTexture.width, croppedTexture.height);

    return this;
  }

  public removeCrop(): this {
    if (!this.texture || !this.sprite) {
      logger.warn('Cannot remove crop: texture or sprite not loaded');
      return this;
    }

    this.cropRectangle = null;
    this.sprite.texture = this.texture;
    this.setSize(this.width, this.height);
    return this;
  }

  public setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    if (this.sprite) {
      this.sprite.setSize(width, height);
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
      logger.warn('ImageClip not loaded, skipping render');
      return;
    }

    this.container.visible = this.start >= time ? false : true;
  }
}
