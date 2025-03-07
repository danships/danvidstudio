import { Container } from 'pixi.js';
import type { Scene } from './scene';
import type { Clip } from '../base/clip';
import { VisualClip } from '../base/visual-clip';
import { WithId } from '../base/with-id';
import { concat } from '../utils/concat';

export type TrackOptions = {
  id?: string;
  updated?: ((reason?: string) => void) | undefined;
};

export class Track extends WithId {
  private clips: Clip[] = [];
  private container: Container;
  private updated?: ((reason?: string) => void) | undefined;
  private scene?: Scene | null = null;

  constructor(parent: Container | Scene, trackOptions: TrackOptions) {
    super(trackOptions.id);
    this.container = new Container({ label: `Track ${this.id}` });
    this.updated = trackOptions.updated;
    if (parent instanceof Container) {
      parent.addChild(this.container);
    } else {
      parent._getContainer().addChild(this.container);
      this.scene = parent;
    }
  }

  public addClip(clip: Clip) {
    this.clips.push(clip);
    if (clip instanceof VisualClip) {
      this.container.addChild(clip._getContainer());
    }
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

  public setDisplayOrder(displayOrder: number) {
    this.container.parent.setChildIndex(this.container, displayOrder);
    this.updated?.(`display order set ${displayOrder}`);
    return this;
  }

  public remove() {
    this.container.removeFromParent();

    // Remove from scene if we have one
    this.scene?.removeTrack(this, false);
    this.updated?.(`track removed ${this.id} (track)`);
  }

  public _getContainer() {
    return this.container;
  }
}
