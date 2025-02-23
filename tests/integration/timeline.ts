import type { Clip } from '../..';
import type { Composition } from '../..';
import type { Scene } from '../..';
import type { Track } from '../..';

export class Timeline {
  private container: HTMLElement;
  private composition: Composition;
  private scale = 100; // pixels per second

  constructor(container: HTMLElement, composition: Composition) {
    this.container = container;
    this.composition = composition;
    this.initializeStyles();
  }

  private initializeStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .timeline {
        width: 100%;
        overflow-x: auto;
        background: #2a2a2a;
        color: white;
        padding: 10px;
        font-family: Arial, sans-serif;
      }
      .composition-track {
        background: #333;
        padding: 8px;
        border-radius: 4px;
        margin-top: 10px;
        width: fit-content;
      }
      .composition-track-header {
        font-weight: bold;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid #555;
      }
      .scenes-container {
        display: flex;
        gap: 10px;
        width: fit-content;
      }
      .scene {
        background: #3a3a3a;
        padding: 8px;
        border-radius: 4px;
        min-width: 200px;
        flex-shrink: 0;
      }
      .scene-header {
        font-weight: bold;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid #555;
      }
      .track {
        background: #444;
        margin: 4px 0;
        padding: 6px;
        border-radius: 3px;
      }
      .track-header {
        font-size: 0.9em;
        margin-bottom: 4px;
      }
      .clip {
        background: #666;
        margin: 2px 0;
        padding: 4px;
        border-radius: 2px;
        font-size: 0.8em;
      }
      .clip.exceeds-duration {
        background:rgb(225, 60, 60);
      }
      .clip-info {
        display: flex;
        justify-content: space-between;
      }
    `;
    document.head.append(style);
  }

  public render() {
    const timelineContainer = document.createElement('div');
    timelineContainer.className = 'timeline';

    const scenesContainer = document.createElement('div');
    scenesContainer.className = 'scenes-container';

    // Render scenes first
    for (const [index, scene] of this.composition['scenes'].entries()) {
      scenesContainer.append(this.createSceneElement(scene, index));
    }

    timelineContainer.append(scenesContainer);

    // Add composition track at the bottom if it exists
    const compositionTrack = this.composition.getCompositionTrack();
    if (compositionTrack) {
      const compositionTrackElement = document.createElement('div');
      compositionTrackElement.className = 'composition-track';

      const compositionTrackHeader = document.createElement('div');
      compositionTrackHeader.className = 'composition-track-header';
      compositionTrackHeader.textContent = 'Composition Track';
      compositionTrackElement.append(compositionTrackHeader);

      const trackElement = this.createTrackElement(compositionTrack, this.composition.getDuration());
      compositionTrackElement.append(trackElement);

      // Set the width to match scenes container
      requestAnimationFrame(() => {
        compositionTrackElement.style.width = `${scenesContainer.offsetWidth}px`;
      });

      timelineContainer.append(compositionTrackElement);
    }

    this.container.append(timelineContainer);
  }

  private createSceneElement(scene: Scene, index: number): HTMLElement {
    const sceneElement = document.createElement('div');
    sceneElement.className = 'scene';

    const sceneHeader = document.createElement('div');
    sceneHeader.className = 'scene-header';
    sceneHeader.textContent = `Scene ${index + 1} (${scene.getDuration().toFixed(1)}s)`;
    sceneElement.append(sceneHeader);

    for (const track of scene.getTracks()) {
      sceneElement.append(this.createTrackElement(track, scene.getDuration()));
    }

    return sceneElement;
  }

  private createTrackElement(track: Track, sceneDuration: number): HTMLElement {
    const trackElement = document.createElement('div');
    trackElement.className = 'track';

    const trackHeader = document.createElement('div');
    trackHeader.className = 'track-header';
    trackHeader.textContent = `Track ${track.id}`;
    trackElement.append(trackHeader);

    for (const clip of track.getClips()) {
      const clipElement = this.createClipElement(clip);
      // Check if clip exceeds scene duration
      if (clip.getOffset() + clip.getDuration() > sceneDuration) {
        clipElement.classList.add('exceeds-duration');
      }
      trackElement.append(clipElement);
    }

    return trackElement;
  }

  private createClipElement(clip: Clip): HTMLElement {
    const clipElement = document.createElement('div');
    clipElement.className = 'clip';

    const clipInfo = document.createElement('div');
    clipInfo.className = 'clip-info';

    const clipType = document.createElement('span');
    clipType.textContent = `Clip ${clip.id}/${clip.getType()}`;

    const clipDuration = document.createElement('span');
    clipDuration.textContent = `${clip.getDuration().toFixed(1)}s`;

    clipInfo.append(clipType);
    clipInfo.append(clipDuration);
    clipElement.append(clipInfo);

    // Set the width based on duration
    clipElement.style.width = `${clip.getDuration() * this.scale}px`;

    return clipElement;
  }

  public updateScale(newScale: number) {
    this.scale = newScale;
    this.container.innerHTML = '';
    this.render();
  }
}
