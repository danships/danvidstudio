import { Assets, Texture } from 'pixi.js';

export class ImageSource {
  private constructor(
    public _texture: Texture,
    public width: number,
    public height: number
  ) {}

  public static async create(url: string | File | Blob): Promise<ImageSource> {
    if (typeof url === 'string' && !url.startsWith('blob:')) {
      const texture = await Assets.load(url);
      return new ImageSource(texture, texture.width, texture.height);
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
