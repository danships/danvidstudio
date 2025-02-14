import type { Container } from 'pixi.js';
import { Clip } from './clip';
import type { Track } from '../composition/track';

export type VisualOptions = {
  id?: string | undefined;
  start: number;
  end: number;
  top?: number | undefined;
  left?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  track?: Track | undefined;
};

export abstract class VisualClip extends Clip {
  public top: number = 0;
  public left: number = 0;
  public width: number = 100;
  public height: number = 100;

  constructor(options: VisualOptions) {
    super({ id: options.id, start: options.start, end: options.end, track: options.track });

    if (options.top) {
      this.top = options.top;
    }
    if (options.left) {
      this.left = options.left;
    }
    if (options.width) {
      this.width = options.width;
    }
    if (options.height) {
      this.height = options.height;
    }
  }

  public abstract _getContainer(): Container;
  public abstract render(time: number): void;
}
