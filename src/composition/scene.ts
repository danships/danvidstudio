import { Container } from 'pixi.js';
import type { Composition } from './composition';
import type { TrackOptions } from './track';
import { Track } from './track';
import type { Clip } from '../base/clip';
import { WithId } from '../base/with-id';

export type SceneOptions = {
  id?: string;
  duration: number;
  updated?: ((reason?: string) => void) | undefined;
};

type CompositionDetails = {
  composition: Composition;
  updateDuration: (oldDuration: number, duration: number) => void;
  setContainer: (container: Container) => void;
};

export class Scene extends WithId {
  public tracks: Track[] = [];

  private duration: number;
  private updateDuration: (oldDuration: number, duration: number) => void;
  private container: Container;

  private updated?: ((reason?: string) => void) | undefined;
  private composition: Composition;

  constructor({ updateDuration, setContainer, composition }: CompositionDetails, options: SceneOptions) {
    super(options.id);

    this.duration = options.duration;
    this.updateDuration = updateDuration;
    updateDuration(0, this.duration);

    this.container = new Container({ label: `Scene ${this.id}` });
    setContainer(this.container);

    this.updated = options.updated;
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
    const track = new Track(this, { ...options, updated: this.updated });
    this.tracks.push(track);
    this.updated?.(`Track added ${track.id}`);
    return track;
  }

  public removeTrack(track: Track) {
    const index = this.tracks.indexOf(track);
    if (index === -1) {
      return;
    }

    // Remove from tracks array
    this.tracks.splice(index, 1);

    // Clean up the track
    track.destroy();

    this.updated?.(`Track removed ${track.id}`);
  }

  public setDuration(duration: number) {
    this.duration = duration;
    this.updateDuration(this.duration, duration);
    return this;
  }

  public getDuration() {
    return this.duration;
  }

  public _setUpdated(updated: (reason?: string) => void) {
    this.updated = updated;
    return this;
  }

  public destroy() {
    // Destroy all tracks
    for (const track of this.tracks) {
      track.destroy();
    }
    this.tracks = [];

    // Destroy the container and its children
    this.container.destroy({ children: true });
  }

  public getTracks() {
    return this.tracks;
  }

  public getClips() {
    return this.tracks.flatMap((track) => track.getClips());
  }

  /**
   * Add a clip to the scene. Will create a new track automatically.
   * @param clip - The clip to add.
   * @returns The clip that was added.
   */
  public addClip(clip: Clip) {
    const track = this.addTrack({});
    track.addClip(clip);
    return clip;
  }

  public _getContainer() {
    return this.container;
  }

  public setDisplayOrder(displayOrder: number) {
    this.composition.setSceneDisplayOrder(this, displayOrder);
    this.updated?.(`Display order set ${displayOrder}`);
    return this;
  }

  public remove() {
    for (const track of this.tracks) {
      track.remove();
    }

    // Remove from composition
    this.composition.removeScene(this);
  }
}
