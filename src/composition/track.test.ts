import { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Scene } from './scene';
import { Track } from './track';
import { Clip, type ClipOptions } from '../base/clip';
import type { VisualClip } from '../base/visual-clip';
import { ClipType } from '../types';

// Mock VisualClip
const mockClipContainer = new Container();
const createMockClip = () =>
  ({
    id: 'mock-clip',
    destroy: vi.fn(),
    setTrack: vi.fn(),
    _setUpdated: vi.fn(),
    _getContainer: () => mockClipContainer,
    render: vi.fn(),
    remove: vi.fn(),
    getType: vi.fn(),
  }) as unknown as VisualClip;

class TestClip extends Clip {
  private destroySpy = vi.fn();
  private removeSpy = vi.fn();

  constructor(options: Partial<ClipOptions> = {}) {
    super({ offset: 0, duration: options.duration ?? 5 });
  }

  public destroy(): void {
    this.destroySpy();
  }

  public remove(): void {
    this.removeSpy();
  }

  public render(): void {}

  public getType(): ClipType {
    return ClipType.IMAGE; // We need an implementation for this, since its abstract in the base class
  }

  // Expose spy functions for assertions
  public getDestroySpy() {
    return this.destroySpy;
  }

  public getRemoveSpy() {
    return this.removeSpy;
  }
}

describe('Track', () => {
  let track: Track;
  let mockScene: Scene;
  let mockParentContainer: Container;
  let mockUpdated: ReturnType<typeof vi.fn>;
  let mockUpdateDuration: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockParentContainer = new Container();
    mockUpdated = vi.fn();
    mockUpdateDuration = vi.fn();

    // Create a proper mock Scene
    mockScene = {
      removeTrack: vi.fn(),
      container: mockParentContainer,
      updateDuration: mockUpdateDuration,
      _getContainer: () => mockParentContainer,
    } as unknown as Scene;

    track = new Track(mockScene, {
      updated: mockUpdated,
    });
  });

  describe('initialization', () => {
    it('should create a track with container added to parent', () => {
      expect(track).toBeDefined();
      expect(mockParentContainer.children).toHaveLength(1);
      expect(mockParentContainer.children[0]).toBeInstanceOf(Container);
    });

    it('should set the correct label on the container', () => {
      const container = track['container'];
      expect(container.label).toBe(`Track ${track.id}`);
    });

    it('should initialize with Container parent', () => {
      const parentContainer = new Container();
      const containerTrack = new Track(parentContainer, {});
      expect(parentContainer.children).toHaveLength(1);
      expect(parentContainer.children[0]).toBe(containerTrack['container']);
    });
  });

  describe('clip management', () => {
    it('should add clips correctly', () => {
      const clip = createMockClip();
      track.addClip(clip);

      expect(track['clips']).toHaveLength(1);
      expect(clip.setTrack).toHaveBeenCalledWith(track);
      expect(clip._setUpdated).toHaveBeenCalledWith(mockUpdated);
      expect(mockUpdated).toHaveBeenCalled();
    });

    it('should remove clips correctly', () => {
      const clip1 = createMockClip();
      const clip2 = createMockClip();

      track.addClip(clip1);
      track.addClip(clip2);
      expect(track['clips']).toHaveLength(2);

      // Remove one clip
      track.removeClip(clip1);
      expect(track['clips']).toHaveLength(1);
      expect(clip1.destroy).not.toHaveBeenCalled();
      expect(track['clips'][0]).toBe(clip2);

      // Try to remove non-existent clip (should not throw)
      track.removeClip(clip1);
      expect(track['clips']).toHaveLength(1);
    });

    it('should render all clips', () => {
      const mockClip1 = createMockClip();
      const mockClip2 = createMockClip();

      track.addClip(mockClip1).addClip(mockClip2);
      track.render(1.5);

      expect(mockClip1.render).toHaveBeenCalledWith(1.5);
      expect(mockClip2.render).toHaveBeenCalledWith(1.5);
    });
  });

  describe('cleanup', () => {
    it('should destroy all clips and container', () => {
      // Add some clips
      const clip1 = new TestClip({});
      const clip2 = new TestClip({});
      track.addClip(clip1);
      track.addClip(clip2);

      // Get container to spy on its destroy method
      const container = track['container'];
      const containerDestroySpy = vi.spyOn(container, 'destroy');

      // Destroy track
      track.destroy();

      // Verify clips are removed
      expect(track['clips']).toHaveLength(0);

      // Verify container was destroyed with children
      expect(containerDestroySpy).toHaveBeenCalledWith({ children: true });
    });

    it('should remove itself from scene', () => {
      const mockRemoveTrack = vi.fn();
      const mockSceneRemove = {
        removeTrack: mockRemoveTrack,
        _getContainer: () => mockParentContainer,
      } as unknown as Scene;

      track = new Track(mockSceneRemove, {
        updated: mockUpdated,
      });

      // Add some clips to test they get removed
      const clip1 = new TestClip({});
      const clip2 = new TestClip({});
      track.addClip(clip1);
      track.addClip(clip2);

      // Mock container's removeFromParent method
      track['container'].removeFromParent = vi.fn();

      track.remove();

      // Verify clips are not removed, and still attached to the track
      expect(clip1.getRemoveSpy()).not.toHaveBeenCalled();
      expect(clip2.getRemoveSpy()).not.toHaveBeenCalled();

      // Verify track was removed from scene
      expect(mockRemoveTrack).toHaveBeenCalledWith(track, false);
    });
  });

  describe('display order', () => {
    it('should set display order correctly', () => {
      const mockSetChildIndex = vi.fn();
      const mockParent = new Container();
      mockParent.setChildIndex = mockSetChildIndex;
      const trackContainer = track['container'];
      trackContainer.parent = mockParent;

      track.setDisplayOrder(2);
      expect(mockSetChildIndex).toHaveBeenCalledWith(trackContainer, 2);
    });
  });

  describe('update callback', () => {
    it('should propagate updated callback to clips', () => {
      const clip1 = createMockClip();
      const clip2 = createMockClip();
      track.addClip(clip1).addClip(clip2);

      const newUpdated = vi.fn();
      track._setUpdated(newUpdated);

      expect(clip1._setUpdated).toHaveBeenCalledWith(newUpdated);
      expect(clip2._setUpdated).toHaveBeenCalledWith(newUpdated);
    });
  });

  describe('container management', () => {
    it('should get container correctly', () => {
      const container = track._getContainer();
      expect(container).toBe(track['container']);
    });
  });
});
