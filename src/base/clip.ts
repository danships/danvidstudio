import { WithId } from './with-id';
import type { Track } from '../composition/track';
import { concat } from '../utils/concat';

export type ClipOptions = {
  id?: string | undefined;
  start: number;
  end: number;
  track?: Track | undefined;
  updated?: ((reason?: string) => void) | undefined;
};

export abstract class Clip extends WithId {
  public start: number;
  public end: number;

  private track?: Track | undefined;
  protected updated?: ((reason?: string) => void) | undefined;
  constructor(options: ClipOptions) {
    super(options.id);

    this.start = options.start;
    this.end = options.end;
    this.updated = options?.updated;
  }

  public setTrack(track: Track) {
    this.track = track;
  }

  public _setUpdated(updated: (reason?: string) => void) {
    this.updated = updated;
    this.triggerUpdated('Updated set.');
    return this;
  }

  public setStart(start: number) {
    this.start = start;
    this.triggerUpdated('Start changed');
  }

  public setEnd(end: number) {
    this.end = end;
    this.triggerUpdated('End changed');
  }

  protected getTrack() {
    if (!this.track) {
      throw new Error('Track is not set');
    }

    return this.track;
  }

  protected triggerUpdated(reason: string) {
    this.updated?.(concat('clip updated', this.id, reason));
  }
}
