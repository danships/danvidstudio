import { Assets, Texture } from 'pixi.js';
import type { Size } from '../types';

export class ImageSource {
  private constructor(public _texture: Texture) {
    if (this._texture === undefined) {
      // Asset.load()/Texture.from() returns undefined if it cannot load the image.
      throw new Error('Could not initialize ImageSource with image.');
    }
  }

  public static async create(url: string | File | Blob): Promise<ImageSource> {
    if (typeof url === 'string' && !url.startsWith('blob:')) {
      const texture = await Assets.load(url);
      return new ImageSource(texture);
    }

    if (typeof url === 'string') {
      return ImageSource.createFromObjectUrl(url);
    }

    const objectUrl = URL.createObjectURL(url);
    const imageSource = await ImageSource.createFromObjectUrl(objectUrl);
    URL.revokeObjectURL(objectUrl);
    return imageSource;
  }

  public static async createFromObjectUrl(objectUrl: string): Promise<ImageSource> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', function () {
        const texture = Texture.from(img);
        resolve(new ImageSource(texture));
      });
      img.addEventListener('error', function () {
        reject(new Error('Failed to load image'));
      });
      img.src = objectUrl;
    });
  }

  public destroy(): void {
    // Destroy the texture and its base texture
    if (this._texture) {
      this._texture.destroy(true);
    }
  }

  public getSize(): Size {
    return { width: this._texture.width, height: this._texture.height };
  }
}
