import { Container } from 'pixi.js';
import type { Scene } from './scene';
import type { VisualClip } from '../base/visual-clip';
import { WithId } from '../base/with-id';

export type TrackOptions = {
  id?: string;
};

export class Track extends WithId {
  private clips: VisualClip[] = [];
  private container: Container;

  constructor(
    public scene: Scene,
    parent: Container,
    trackOptions: TrackOptions
  ) {
    super(trackOptions.id);
    this.container = new Container();
    parent.addChild(this.container);
  }

  public addClip(clip: VisualClip) {
    this.clips.push(clip);
    this.container.addChild(clip._getContainer());
    clip.setTrack(this);
  }

  public render(time: number) {
    for (const clip of this.clips) {
      clip.render(time);
    }
  }
}
