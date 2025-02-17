import { Assets, type Texture } from 'pixi.js';

export class ImageSource {
  constructor(
    public _texture: Texture,
    public width: number,
    public height: number
  ) {}

  public static async create(url: string): Promise<ImageSource> {
    const texture = await Assets.load(url);

    return new ImageSource(texture, texture.width, texture.height);
  }

  public destroy(): void {
    // Destroy the texture and its base texture
    if (this._texture) {
      this._texture.destroy(true);
    }
  }
}
