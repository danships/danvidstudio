import { Container } from 'pixi.js';
import type { Scene } from './scene';
import type { VisualClip } from '../base/visual-clip';
import { WithId } from '../base/with-id';
import { concat } from '../utils/concat';

export type TrackOptions = {
  id?: string;
  updated?: ((reason?: string) => void) | undefined;
};

export class Track extends WithId {
  private clips: VisualClip[] = [];
  private container: Container;
  private updated?: ((reason?: string) => void) | undefined;

  constructor(
    public scene: Scene,
    parent: Container,
    trackOptions: TrackOptions
  ) {
    super(trackOptions.id);
    this.container = new Container();
    this.updated = trackOptions.updated;
    parent.addChild(this.container);
  }

  public addClip(clip: VisualClip) {
    this.clips.push(clip);
    this.container.addChild(clip._getContainer());
    clip.setTrack(this);
    if (this.updated) {
      clip._setUpdated(this.updated);
    }
    this.updated?.(concat('clip added', clip.id));

    return this;
  }

  public removeClip(clip: VisualClip) {
    const index = this.clips.indexOf(clip);
    if (index === -1) {
      return;
    }

    // Remove from clips array
    this.clips.splice(index, 1);

    // Remove from container
    // eslint-disable-next-line unicorn/prefer-dom-node-remove
    this.container.removeChild(clip._getContainer());

    // Clean up the clip
    clip.destroy();

    this.updated?.(concat('clip removed', clip.id));
  }

  public render(time: number) {
    for (const clip of this.clips) {
      clip.render(time);
    }
  }

  public _setUpdated(updated: (reason?: string) => void) {
    this.updated = updated;
    for (const clip of this.clips) {
      clip._setUpdated(this.updated);
    }
    return this;
  }

  public destroy() {
    // Destroy all clips
    for (const clip of this.clips) {
      clip.destroy();
    }
    this.clips = [];

    // Destroy the container and its children
    this.container.destroy({ children: true });
  }

  public getClips() {
    return this.clips;
  }
}
