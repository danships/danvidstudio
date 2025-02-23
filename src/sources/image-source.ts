import { Assets, Texture } from 'pixi.js';

export class ImageSource {
  private constructor(
    public _texture: Texture,
    public width: number,
    public height: number
  ) {}

  public static async create(url: string | File | Blob): Promise<ImageSource> {
    if (typeof url === 'string') {
      const texture = await Assets.load(url);
      return new ImageSource(texture, texture.width, texture.height);
    }

    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(url);
      const img = new Image();
      img.addEventListener('load', function () {
        URL.revokeObjectURL(objectUrl);
        const texture = Texture.from(img);
        resolve(new ImageSource(texture, texture.width, texture.height));
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
}
