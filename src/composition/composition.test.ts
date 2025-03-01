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

// Mock Application class
vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  return {
    ...actual,
    Application: vi.fn().mockImplementation(() => ({
      // eslint-disable-next-line unicorn/no-useless-undefined
      init: vi.fn().mockResolvedValue(undefined),
      renderer: {
        resize: vi.fn(),
        width: 1920,
        height: 1080,
      },
      ticker: {
        maxFPS: 25,
        add: vi.fn().mockReturnThis(),
        stop: vi.fn(),
        start: vi.fn(),
      },
      stage: {
        addChild: vi.fn(),
        setChildIndex: vi.fn(),
        children: [],
      },
      render: vi.fn(),
      canvas: document.createElement('canvas'),
    })),
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
      setDisplayOrder: vi.fn(),
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
      expect(composition.isPlaying()).toBe(true);

      composition.pause();
      expect(composition['playStatus'].isPlaying).toBe(false);
      expect(composition.isPlaying()).toBe(false);
    });

    it('should seek to correct time', async () => {
      await composition.waitForReady();
      composition.createScene({ duration: 5 });
      composition.createScene({ duration: 5 });

      composition.seek(7); // Seek to 2nd scene

      expect(composition['playStatus'].currentTime).toBe(7);
      expect(composition.getCurrentTime()).toBe(7);
      // We can't test container.visible directly as it's private, but we can verify the seek behavior
      // through the composition's state
      expect(composition['playStatus'].activeSceneIndex).toBe(1); // Second scene should be active
    });

    it('should track current time during playback', async () => {
      await composition.waitForReady();
      composition.createScene({ duration: 5 });

      // Initial time should be 0
      expect(composition.getCurrentTime()).toBe(0);

      // Simulate playback by manually updating time
      composition['playStatus'].currentTime = 2.5;
      expect(composition.getCurrentTime()).toBe(2.5);

      // Time should update after seeking
      composition.seek(4);
      expect(composition.getCurrentTime()).toBe(4);
    });

    it('should correctly report playing state', async () => {
      await composition.waitForReady();
      composition.createScene({ duration: 5 });

      // Should be paused initially
      expect(composition.isPlaying()).toBe(false);

      // Should be playing after play() is called
      composition.play();
      expect(composition.isPlaying()).toBe(true);

      // Should be paused after pause() is called
      composition.pause();
      expect(composition.isPlaying()).toBe(false);

      // Should remain paused after seeking
      composition.seek(2);
      expect(composition.isPlaying()).toBe(false);

      // Should be playing after play() is called again
      composition.play();
      expect(composition.isPlaying()).toBe(true);
    });
  });

  describe('time update events', () => {
    it('should notify time update listeners and handle removal correctly', async () => {
      await composition.waitForReady();
      const listener = vi.fn();

      composition.createScene({ duration: 5 }); // Add a scene to have non-zero duration

      const id = composition.on('time', listener);
      listener.mockClear(); // Clear initial calls

      // First seek should notify the listener
      composition.seek(2);
      expect(listener).toHaveBeenLastCalledWith(2, 5);

      // Remove the listener
      composition.off('time', id);
      listener.mockClear();

      // Add a new listener to verify the first one was truly removed
      const newListener = vi.fn();
      composition.on('time', newListener);

      // Second seek should only notify the new listener
      composition.seek(3);
      expect(listener).not.toHaveBeenCalled();
      expect(newListener).toHaveBeenCalledWith(3, 5);
    });

    it('should handle composition update events correctly', async () => {
      await composition.waitForReady();
      const compositionListener = vi.fn();
      const timeListener = vi.fn();

      const compositionId = composition.on('composition', compositionListener);
      const timeId = composition.on('time', timeListener);

      // Trigger a composition update by creating a scene
      composition.createScene({ duration: 5 });
      expect(compositionListener).toHaveBeenCalled();

      // Remove composition listener
      composition.off('composition', compositionId);
      compositionListener.mockClear();

      // Create another scene, should not trigger removed listener
      composition.createScene({ duration: 3 });
      expect(compositionListener).not.toHaveBeenCalled();

      // Time listener should still work
      composition.seek(2);
      expect(timeListener).toHaveBeenCalled();

      // Clean up time listener
      composition.off('time', timeId);
      timeListener.mockClear();

      composition.seek(3);
      expect(timeListener).not.toHaveBeenCalled();
    });

    it('should handle size update events correctly', async () => {
      await composition.waitForReady();
      const sizeListener = vi.fn();

      // Adding a size listener should immediately call it with current size
      const sizeId = composition.on('size', sizeListener);
      expect(sizeListener).toHaveBeenLastCalledWith(1920, 1080);
      sizeListener.mockClear();

      // Changing size should trigger the listener and resize the renderer
      composition.setSize(1280, 720);
      expect(sizeListener).toHaveBeenLastCalledWith(1280, 720);
      expect(composition['app'].renderer.resize).toHaveBeenCalledWith(1280, 720);

      // Remove size listener
      composition.off('size', sizeId);
      sizeListener.mockClear();

      // Size changes should not trigger removed listener but should still resize renderer
      composition.setSize(800, 600);
      expect(sizeListener).not.toHaveBeenCalled();
      expect(composition['app'].renderer.resize).toHaveBeenCalledWith(800, 600);
    });

    it('should handle multiple size listeners correctly', async () => {
      await composition.waitForReady();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      // Both listeners should be called immediately with current size
      composition.on('size', listener1);
      composition.on('size', listener2);
      expect(listener1).toHaveBeenLastCalledWith(1920, 1080);
      expect(listener2).toHaveBeenLastCalledWith(1920, 1080);
      listener1.mockClear();
      listener2.mockClear();

      // Both listeners should receive size updates and renderer should be resized
      composition.setSize(1280, 720);
      expect(listener1).toHaveBeenLastCalledWith(1280, 720);
      expect(listener2).toHaveBeenLastCalledWith(1280, 720);
      expect(composition['app'].renderer.resize).toHaveBeenCalledWith(1280, 720);
    });
  });

  describe('backward compatibility', () => {
    it('should maintain backward compatibility with onTimeUpdate', async () => {
      await composition.waitForReady();
      const listener = vi.fn();
      composition.createScene({ duration: 5 });

      const id = composition.on('time', listener);
      listener.mockClear();

      composition.seek(2);
      expect(listener).toHaveBeenLastCalledWith(2, 5);

      composition.off('time', id);
      listener.mockClear();

      composition.seek(3);
      expect(listener).not.toHaveBeenCalled();
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
      expect(track?.setDisplayOrder).toHaveBeenCalledWith(0);

      // Second call should use the existing track
      composition.addClipToComposition(mockClip);
      expect(composition['compositionTrack']).toBe(track);
      expect(track?.addClip).toHaveBeenCalledTimes(2);
      // setDisplayOrder should only be called once during track creation
      expect(track?.setDisplayOrder).toHaveBeenCalledTimes(1);
    });
  });

  describe('scene display order', () => {
    it('should set scene display order correctly', async () => {
      await composition.waitForReady();
      const scene = composition.createScene({ duration: 5 });
      const container = scene._getContainer();

      composition.setSceneDisplayOrder(scene, 2);
      expect(composition['app'].stage.setChildIndex).toHaveBeenCalledWith(container, 2);
    });
  });
});
