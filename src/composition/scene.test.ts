import { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { Scene } from './scene';
import { Track } from './track';

// Mock Track class
vi.mock('./track', () => {
  return {
    Track: vi.fn().mockImplementation(() => ({
      id: 'mock-track',
      destroy: vi.fn(),
      render: vi.fn(),
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
});
