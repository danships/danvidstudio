import { Assets, Container, Sprite } from 'pixi.js';
import { VisualClip, type VisualOptions } from '../base/visual-clip';
import { logger } from '../utils/logger';

export type Options = VisualOptions & {
  src: string;
};

export class ImageClip extends VisualClip {
  private container: Container;
  private sprite: Sprite | null = null;

  public loaded: boolean = false;

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

    const container = new Container();
    this.container = container;

    (async () => {
      const texture = await Assets.load(options.src);

      this.sprite = Sprite.from(texture);
      this.sprite.setSize(this.width, this.height);
      this.sprite.position.set(this.left, this.top);
      this.loaded = true;

      container.addChild(this.sprite);
    })();
  }

  public _getContainer(): Container {
    return this.container;
  }

  public render(time: number): void {
    if (!this.loaded || !this.sprite) {
      logger.warn('ImageClip not loaded, skipping render');
      return;
    }

    this.container.visible = this.start >= time ? false : true;
  }
}
