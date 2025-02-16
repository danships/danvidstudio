import type { Container } from 'pixi.js';
import { Clip } from './clip';
import type { Track } from '../composition/track';
import type { Position, Size } from '../types';

export type VisualOptions = {
  id?: string | undefined;
  start: number;
  end: number;
  position?: Position | undefined;
  size?: Size | undefined;
  track?: Track | undefined;
  updated?: ((reason?: string) => void) | undefined;
};

export abstract class VisualClip extends Clip {
  protected position?: Position;
  protected size?: Size;

  constructor(options: VisualOptions) {
    super({ id: options.id, start: options.start, end: options.end, track: options.track, updated: options.updated });

    if (options.position) {
      this.position = options.position;
    }

    if (options.size) {
      this.size = options.size;
    }
  }

  public getPosition() {
    return this.position;
  }
  public setPosition(position: Position) {
    this.position = position;
    this.triggerUpdated('Position changed');
  }

  public setSize(size: Size) {
    this.size = size;
    this.triggerUpdated('Size changed');
  }
  public getSize() {
    return this.size;
  }

  public abstract _getContainer(): Container;
  public abstract render(time: number): void;
}
