import type { Container } from 'pixi.js';
import { Clip } from './clip';
import type { Track } from '../composition/track';
import type { Position, Size } from '../types';

export type VisualOptions = {
  id?: string | undefined;
  offset: number;
  duration: number;
  position?: Position | undefined;
  size?: Size | undefined;
  track?: Track | undefined;
  updated?: ((reason?: string) => void) | undefined;
};

export type VisualClipOptionsWithoutOffsetDuration = Omit<VisualOptions, 'offset' | 'duration'>;

export abstract class VisualClip extends Clip {
  protected position?: Position;
  protected size?: Size;

  constructor(options: VisualOptions) {
    super({
      id: options.id,
      offset: options.offset,
      duration: options.duration,
      track: options.track,
      updated: options.updated,
    });

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
  public setPosition(left: number, top: number) {
    this.position = { left, top };
    this.triggerUpdated('Position changed');
  }

  public setSize(width: number, height: number) {
    this.size = { width, height };
    this.triggerUpdated('Size changed');
  }
  public getSize() {
    return this.size;
  }

  public remove(): void {
    this._getContainer().removeFromParent();
    const track = this.getTrack();
    track.removeClip(this);
  }

  public setDisplayOrder(displayOrder: number) {
    this._getContainer().parent.setChildIndex(this._getContainer(), displayOrder);
    this.triggerUpdated(`Display order set ${displayOrder}`);
    return this;
  }

  public getDisplayOrder() {
    return this._getContainer().parent.getChildIndex(this._getContainer());
  }

  public abstract _getContainer(): Container;
  public abstract render(time: number): void;
}
