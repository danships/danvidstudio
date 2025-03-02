import { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { Composition } from './composition';
import { Scene } from './scene';
import { Track, type TrackOptions } from './track';
import { Clip } from '../base/clip';
import { ClipType } from '../types';

// Create a concrete implementation of Clip for testing
class TestClip extends Clip {
  public destroy(): void {
    // Implementation for testing
  }

  public render(): void {
    // Implementation for testing
  }

  public remove(): void {
    // Implementation for testing
  }

  public getType(): ClipType {
    return ClipType.IMAGE; // We need an implementation for this, since its abstract in the base class
  }
}

// Mock Track class
vi.mock('./track', () => {
  return {
    Track: vi.fn().mockImplementation((_parent: Container | Scene, options: TrackOptions) => ({
      id: options.id || 'mock-track',
      destroy: vi.fn(),
      render: vi.fn(),
      addClip: vi.fn(),
      getClips: vi.fn().mockReturnValue([]),
      _getContainer: vi.fn().mockReturnValue(new Container()),
      remove: vi.fn(),
    })),
  };
});

describe('Scene', () => {
  let scene: Scene;
  let mockUpdateDuration: Mock;
  let mockSetContainer: Mock;

  beforeEach(() => {
    mockUpdateDuration = vi.fn();
    mockSetContainer = vi.fn();

    scene = new Scene(
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        composition: {} as any,
        updateDuration: mockUpdateDuration,
        setContainer: mockSetContainer,
      },
      {
        duration: 5,
      }
    );
  });

  describe('initialization', () => {
    it('should create a scene with correct duration', () => {
      expect(scene.getDuration()).toBe(5);
      expect(mockUpdateDuration).toHaveBeenCalledWith(0, 5);
    });

    it('should create and set up container', () => {
      expect(mockSetContainer).toHaveBeenCalledWith(expect.any(Container));
    });

    it('should set the correct label on the container', () => {
      const container = scene['container'];
      expect(container.label).toBe(`Scene ${scene.id}`);
    });
  });

  describe('track management', () => {
    it('should create tracks correctly', () => {
      const track = scene.createTrack({});
      expect(track).toBeDefined();
      expect(Track).toHaveBeenCalled();
      expect(scene.getTracks()).toHaveLength(1);
    });

    it('should add existing track correctly', () => {
      // Create a mock track with a mock container
      const mockContainer = new Container();
      const mockTrack = {
        id: 'mock-track-2',
        _getContainer: vi.fn().mockReturnValue(mockContainer),
      } as unknown as Track;

      scene.addTrack(mockTrack);

      expect(scene.getTracks()).toHaveLength(1);
      expect(scene.getTracks()[0]).toBe(mockTrack);
      expect(scene['container'].children).toContain(mockContainer);
    });

    it('should get all clips from all tracks', () => {
      // Create mock clips
      const mockClip1 = new TestClip({ offset: 0, duration: 5 });
      const mockClip2 = new TestClip({ offset: 5, duration: 5 });

      // Add two tracks
      const track1 = scene.createTrack({});
      const track2 = scene.createTrack({});

      // Setup mock returns for getClips
      vi.mocked(track1.getClips).mockReturnValue([mockClip1]);
      vi.mocked(track2.getClips).mockReturnValue([mockClip2]);

      // Get all clips
      const clips = scene.getClips();

      // Verify both tracks' getClips were called
      expect(track1.getClips).toHaveBeenCalled();
      expect(track2.getClips).toHaveBeenCalled();

      // Verify we got all clips
      expect(clips).toHaveLength(2);
      expect(clips).toContain(mockClip1);
      expect(clips).toContain(mockClip2);
    });

    it('should remove tracks correctly', () => {
      // Add some tracks
      const track1 = scene.createTrack({ id: 'track1' });
      const track2 = scene.createTrack({ id: 'track2' });
      expect(scene.getTracks()).toHaveLength(2);

      // Mock remove method
      track1.remove = vi.fn();

      // Remove one track
      scene.removeTrack(track1);
      expect(scene.getTracks()).toHaveLength(1);
      expect(track1.remove).toHaveBeenCalled();
      expect(scene.getTracks()[0]).toBe(track2);

      // Try to remove non-existent track (should not throw)
      scene.removeTrack(track1);
      expect(scene.getTracks()).toHaveLength(1);
    });
  });

  describe('cleanup', () => {
    it('should destroy all tracks and container', () => {
      // Add some tracks
      const track1 = scene.createTrack({});
      const track2 = scene.createTrack({});

      // Get container to spy on its destroy method
      const container = scene['container'];
      const containerDestroySpy = vi.spyOn(container, 'destroy');

      // Destroy scene
      scene.destroy();

      // Verify all tracks were destroyed
      expect(track1.destroy).toHaveBeenCalled();
      expect(track2.destroy).toHaveBeenCalled();
      expect(scene.getTracks()).toHaveLength(0);

      // Verify container was destroyed with children
      expect(containerDestroySpy).toHaveBeenCalledWith({ children: true });
    });

    it('should remove itself from composition', () => {
      const mockRemoveScene = vi.fn();
      const mockComposition = {
        removeScene: mockRemoveScene,
      } as unknown as Composition;

      scene = new Scene(
        {
          composition: mockComposition,
          updateDuration: mockUpdateDuration,
          setContainer: mockSetContainer,
        },
        {
          duration: 5,
        }
      );

      // Add some tracks to test they get removed
      const track1 = scene.createTrack({});
      const track2 = scene.createTrack({});

      // Mock track remove methods
      track1.remove = vi.fn();
      track2.remove = vi.fn();

      scene.remove();

      // Verify tracks were removed
      expect(track1.remove).toHaveBeenCalled();
      expect(track2.remove).toHaveBeenCalled();

      // Verify scene was removed from composition
      expect(mockRemoveScene).toHaveBeenCalledWith(scene);
    });
  });

  describe('clip management', () => {
    it('should add clip by creating a new track and adding the clip to it', () => {
      const mockClip = new TestClip({
        offset: 0,
        duration: 5,
      });
      const addedClip = scene.addClip(mockClip);

      // Verify a new track was created
      expect(scene.getTracks()).toHaveLength(1);

      // Since we verified tracks.length is 1, we know this exists
      const track = scene.getTracks()[0]!;
      expect(track).toBeDefined();

      // Verify the clip was added to the track
      expect(track.addClip).toHaveBeenCalledWith(mockClip);

      // Verify the original clip is returned
      expect(addedClip).toBe(mockClip);
    });
  });

  describe('display order', () => {
    it('should set display order through composition', () => {
      const mockSetSceneDisplayOrder = vi.fn();
      const mockComposition = {
        setSceneDisplayOrder: mockSetSceneDisplayOrder,
      } as unknown as Composition;

      scene = new Scene(
        {
          composition: mockComposition,
          updateDuration: mockUpdateDuration,
          setContainer: mockSetContainer,
        },
        {
          duration: 5,
        }
      );

      scene.setDisplayOrder(2);
      expect(mockSetSceneDisplayOrder).toHaveBeenCalledWith(scene, 2);
    });
  });
});
