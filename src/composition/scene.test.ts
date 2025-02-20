import { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { Scene } from './scene';
import { Track } from './track';
import { Clip } from '../base/clip';

// Create a concrete implementation of Clip for testing
class TestClip extends Clip {
  public destroy(): void {
    // Implementation for testing
  }

  public render(): void {
    // Implementation for testing
  }
}

// Mock Track class
vi.mock('./track', () => {
  return {
    Track: vi.fn().mockImplementation(() => ({
      id: 'mock-track',
      destroy: vi.fn(),
      render: vi.fn(),
      addClip: vi.fn(),
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
  });

  describe('track management', () => {
    it('should add tracks correctly', () => {
      const track = scene.addTrack({});
      expect(track).toBeDefined();
      expect(Track).toHaveBeenCalled();
      expect(scene.tracks).toHaveLength(1);
    });

    it('should remove tracks correctly', () => {
      // Add some tracks
      const track1 = scene.addTrack({});
      const track2 = scene.addTrack({});
      expect(scene.tracks).toHaveLength(2);

      // Remove one track
      scene.removeTrack(track1);
      expect(scene.tracks).toHaveLength(1);
      expect(track1.destroy).toHaveBeenCalled();
      expect(scene.tracks[0]).toBe(track2);

      // Try to remove non-existent track (should not throw)
      scene.removeTrack(track1);
      expect(scene.tracks).toHaveLength(1);
    });
  });

  describe('cleanup', () => {
    it('should destroy all tracks and container', () => {
      // Add some tracks
      const track1 = scene.addTrack({});
      const track2 = scene.addTrack({});

      // Get container to spy on its destroy method
      const container = scene['container'];
      const containerDestroySpy = vi.spyOn(container, 'destroy');

      // Destroy scene
      scene.destroy();

      // Verify all tracks were destroyed
      expect(track1.destroy).toHaveBeenCalled();
      expect(track2.destroy).toHaveBeenCalled();
      expect(scene.tracks).toHaveLength(0);

      // Verify container was destroyed with children
      expect(containerDestroySpy).toHaveBeenCalledWith({ children: true });
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
      expect(scene.tracks).toHaveLength(1);

      // Since we verified tracks.length is 1, we know this exists
      const track = scene.tracks[0]!;
      expect(track).toBeDefined();

      // Verify the clip was added to the track
      expect(track.addClip).toHaveBeenCalledWith(mockClip);

      // Verify the original clip is returned
      expect(addedClip).toBe(mockClip);
    });
  });
});
