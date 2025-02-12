import { Container } from 'pixi.js';
import { Track, TrackOptions } from './track';
import { WithId } from '../base/with-id';
import { Composition } from './composition';

export type SceneOptions = {
  id?: string;
  duration: number;
};

type CompositionDetails = {
  composition: Composition;
  updateDuration: (oldDuration: number, duration: number) => void;
  setContainer: (container: Container) => void;
};

export class Scene extends WithId {
  public tracks: Track[] = [];
  public duration: number;

  private container: Container;
  private composition: Composition;

  constructor({ composition, updateDuration, setContainer }: CompositionDetails, options: SceneOptions) {
    super(options.id);

    this.duration = options.duration;
    updateDuration(0, this.duration);

    this.container = new Container();
    setContainer(this.container);
    this.composition = composition;
  }

  public render(time: number) {
    if (!this.container.visible) {
      return;
    }

    for (const track of this.tracks) {
      track.render(time);
    }
  }

  public setVisible(visible: boolean) {
    this.container.visible = visible;
  }

  public addTrack(options: TrackOptions) {
    const track = new Track(this, this.container, options);
    this.tracks.push(track);
    return track;
  }
}
