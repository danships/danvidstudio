import { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Composition } from './composition';
import { Scene } from './scene';
import type { Clip } from '../base/clip';

// Mock Scene class
vi.mock('./scene', () => {
  return {
    Scene: vi.fn().mockImplementation((context, options) => {
      const duration = options.duration;
      const container = new Container();
      // Call updateDuration with initial duration
      context.updateDuration(0, duration);

      return {
        id: 'mock-scene',
        destroy: vi.fn(),
        getDuration: () => duration,
        setVisible: vi.fn(),
        render: vi.fn(),
        addClip: vi.fn(),
        _getContainer: () => container,
      };
    }),
  };
});

// Mock Track class
vi.mock('./track', () => {
  return {
    Track: vi.fn().mockImplementation(() => ({
      id: 'mock-track',
      destroy: vi.fn(),
      render: vi.fn(),
      addClip: vi.fn(),
      getClips: () => [],
    })),
  };
});

describe('Composition', () => {
  let composition: Composition;

  beforeEach(async () => {
    composition = await Composition.create({
      size: { width: 1920, height: 1080 },
      fps: 30,
    });
  });

  describe('initialization', () => {
    it('should create a composition with default values', async () => {
      const defaultComposition = await Composition.create();
      expect(defaultComposition.getSize().width).toBe(1920);
      expect(defaultComposition.getSize().height).toBe(1080);
      expect(defaultComposition.getFps()).toBe(25);
    });

    it('should create a composition with custom values', () => {
      expect(composition.getSize().width).toBe(1920);
      expect(composition.getSize().height).toBe(1080);
      expect(composition.getFps()).toBe(30);
    });
  });

  describe('scene management', () => {
    it('should add scenes correctly', async () => {
      await composition.waitForReady();
      const scene = composition.createScene({ duration: 5 });
      expect(scene).toBeDefined();
      expect(Scene).toHaveBeenCalled();
      expect(composition.getScenes()).toHaveLength(1);
      expect(composition.getDuration()).toBe(5);
    });

    it('should remove scenes correctly', async () => {
      await composition.waitForReady();
      const scene1 = composition.createScene({ duration: 5 });
      const scene2 = composition.createScene({ duration: 3 });
      expect(composition.getScenes()).toHaveLength(2);
      expect(composition.getDuration()).toBe(8);

      // Remove one scene
      composition.removeScene(scene1);
      expect(composition.getScenes()).toHaveLength(1);
      expect(scene1.destroy).toHaveBeenCalled();
      expect(composition.getScenes()[0]).toBe(scene2);
      expect(composition.getDuration()).toBe(3);

      // Try to remove non-existent scene (should not throw)
      composition.removeScene(scene1);
      expect(composition.getScenes()).toHaveLength(1);
      expect(composition.getDuration()).toBe(3);
    });

    it('should handle active scene index when removing scenes', async () => {
      await composition.waitForReady();
      const scene1 = composition.createScene({ duration: 5 });
      const scene2 = composition.createScene({ duration: 3 });
      const scene3 = composition.createScene({ duration: 4 });

      // Set active scene to middle scene
      composition['playStatus'].activeSceneIndex = 1;

      // Remove scene before active scene
      composition.removeScene(scene1);
      expect(composition['playStatus'].activeSceneIndex).toBe(0);

      // Remove active scene
      composition.removeScene(scene2);
      expect(composition['playStatus'].activeSceneIndex).toBe(null);

      // Set active scene and remove last scene
      composition['playStatus'].activeSceneIndex = 0;
      composition.removeScene(scene3);
      expect(composition['playStatus'].activeSceneIndex).toBe(null); // When removing the last scene, activeSceneIndex should be null
    });
  });

  describe('playback control', () => {
    it('should handle play/pause state correctly', async () => {
      await composition.waitForReady();

      composition.play();
      expect(composition['playStatus'].isPlaying).toBe(true);

      composition.pause();
      expect(composition['playStatus'].isPlaying).toBe(false);
    });

    it('should seek to correct time', async () => {
      await composition.waitForReady();
      composition.createScene({ duration: 5 });
      composition.createScene({ duration: 5 });

      composition.seek(7); // Seek to 2nd scene

      expect(composition['playStatus'].currentTime).toBe(7);
      // We can't test container.visible directly as it's private, but we can verify the seek behavior
      // through the composition's state
      expect(composition['playStatus'].activeSceneIndex).toBe(1); // Second scene should be active
    });
  });

  describe('time update events', () => {
    it('should notify listeners of time updates and handle removal correctly', async () => {
      await composition.waitForReady();
      const listener = vi.fn();

      composition.createScene({ duration: 5 }); // Add a scene to have non-zero duration

      const id = composition.onTimeUpdate(listener);
      listener.mockClear(); // Clear initial calls

      // First seek should notify the listener
      composition.seek(2);
      expect(listener).toHaveBeenLastCalledWith(2, 5);

      // Remove the listener
      composition.offTimeUpdate(id);
      listener.mockClear();

      // Add a new listener to verify the first one was truly removed
      const newListener = vi.fn();
      composition.onTimeUpdate(newListener);

      // Second seek should only notify the new listener
      composition.seek(3);
      expect(listener).not.toHaveBeenCalled();
      expect(newListener).toHaveBeenCalledWith(3, 5);
    });
  });

  describe('clip management', () => {
    it('should add clip as scene correctly', async () => {
      await composition.waitForReady();
      const mockClip = { id: 'test-clip', duration: 5 } as unknown as Clip;
      const scene = composition.addClipWithScene(mockClip, 5);

      expect(scene).toBeDefined();
      expect(Scene).toHaveBeenCalled();
      expect(composition.getScenes()).toHaveLength(1);
      expect(composition.getDuration()).toBe(5);
      expect(scene.addClip).toHaveBeenCalledWith(mockClip);
    });

    it('should add clip to composition track', async () => {
      await composition.waitForReady();
      const mockClip = { id: 'test-clip', duration: 5 } as unknown as Clip;

      // First call should create the composition track
      composition.addClipToComposition(mockClip);
      const track = composition['compositionTrack'];
      expect(track).toBeDefined();
      expect(track?.addClip).toHaveBeenCalledWith(mockClip);

      // Second call should use the existing track
      composition.addClipToComposition(mockClip);
      expect(composition['compositionTrack']).toBe(track);
      expect(track?.addClip).toHaveBeenCalledTimes(2);
    });
  });
});
