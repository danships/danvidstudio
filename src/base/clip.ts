import { WithId } from './with-id';
import type { Track } from '../composition/track';
import { concat } from '../utils/concat';

export type ClipOptions = {
  id?: string | undefined;
  offset: number;
  duration: number;
  track?: Track | undefined;
  updated?: ((reason?: string) => void) | undefined;
};

export abstract class Clip extends WithId {
  protected offset: number;
  protected duration: number;

  protected track?: Track | undefined;
  protected updated?: ((reason?: string) => void) | undefined;
  constructor(options: ClipOptions) {
    super(options.id);

    this.offset = options.offset;
    this.duration = options.duration;
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

  public setOffset(offset: number) {
    this.offset = offset;
    this.triggerUpdated('Offset changed');
  }

  public setDuration(duration: number) {
    this.duration = duration;
    this.triggerUpdated('Duration changed');
  }

  public getDuration() {
    return this.duration;
  }

  public getOffset() {
    return this.offset;
  }

  public getEnd() {
    return this.offset + this.duration;
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

  public abstract destroy(): void;
  public abstract render(time: number): void;
  public abstract remove(): void;
}
