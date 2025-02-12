import { Clip } from './clip';
import type { Track } from '../composition/track';
import { Container } from 'pixi.js';

export type VisualOptions = {
  id?: string | undefined;
  start: number;
  end: number;
  top: number;
  left: number;
  width: number;
  height: number;
  track?: Track | undefined;
};

export abstract class VisualClip extends Clip {
  public top: number;
  public left: number;
  public width: number;
  public height: number;

  constructor(options: VisualOptions) {
    super({ id: options.id, start: options.start, end: options.end, track: options.track });

    this.top = options.top;
    this.left = options.left;
    this.width = options.width;
    this.height = options.height;
  }

  public abstract _getContainer(): Container;
  public abstract render(time: number): void;
}
