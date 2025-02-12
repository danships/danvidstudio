import { WithId } from './with-id';
import type { Track } from '../composition/track';

export type ClipOptions = {
  id?: string | undefined;
  start: number;
  end: number;
  track?: Track | undefined;
};

export abstract class Clip extends WithId {
  public start: number;
  public end: number;

  private track?: Track | undefined;

  constructor(options: ClipOptions) {
    super(options.id);

    this.start = options.start;
    this.end = options.end;
  }

  public setTrack(track: Track) {
    this.track = track;
  }

  protected getTrack() {
    if (!this.track) {
      throw new Error('Track is not set');
    }

    return this.track;
  }
}
