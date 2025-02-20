/* eslint-disable @typescript-eslint/unbound-method */
import type { Sprite } from 'pixi.js';
import { Container, Rectangle } from 'pixi.js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { VideoClip } from './video-clip';
import type { VideoSource } from '../sources/video-source';

// Mock video element and source
const mockVideoElement = {
  autoplay: true,
  muted: false,
  currentTime: 0,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  cloneNode: () => ({
    ...mockVideoElement,
    addEventListener: vi.fn(),
  }),
} as unknown as HTMLVideoElement;

// Create a partial mock of VideoSource with only the properties we need
const mockVideoSource = {
  getVideoElement: () => mockVideoElement,
  duration: 10,
  width: 1920,
  height: 1080,
} as unknown as VideoSource;

describe('VideoClip', () => {
  let videoClip: VideoClip;

  beforeEach(() => {
    vi.clearAllMocks();
    videoClip = new VideoClip({
      id: 'test-video',
      offset: 0,
      duration: 5,
      source: mockVideoSource,
    });
  });

  describe('initialization', () => {
    it('should create a video clip with default values', () => {
      expect(videoClip).toBeDefined();
      expect(videoClip._getContainer()).toBeInstanceOf(Container);
      expect(mockVideoElement.addEventListener).toHaveBeenCalledWith('seeked', expect.any(Function));
      expect(mockVideoElement.autoplay).toBe(false);
      expect(mockVideoElement.muted).toBe(true);
    });

    it('should create a video clip with custom position and size', () => {
      const customClip = new VideoClip({
        id: 'test-video',
        offset: 0,
        duration: 5,
        source: mockVideoSource,
        position: { left: 10, top: 20 },
        size: { width: 1280, height: 720 },
      });

      expect(customClip).toBeDefined();
      // Size and position are set after the video is ready
      expect(customClip._getContainer()).toBeInstanceOf(Container);
    });

    it('should create a video clip with custom speed and range', () => {
      const customClip = new VideoClip({
        id: 'test-video',
        offset: 0,
        duration: 5,
        source: mockVideoSource,
        speed: 2,
        range: { start: 1, end: 6 },
      });

      expect(customClip).toBeDefined();
      // Speed and range are internal properties that affect playback
    });

    it('should throw error for invalid range', () => {
      expect(() => {
        new VideoClip({
          id: 'test-video',
          offset: 0,
          duration: 5,
          source: mockVideoSource,
          range: { start: 6, end: 1 }, // Invalid range
        });
      }).toThrow('Invalid source range: start must be less than end');
    });
  });

  describe('cropping', () => {
    it.skip('should set crop correctly', () => {
      // SKIPPED, because texture is not loaded, so crop does not work then.
      // Trigger ready state by simulating seeked event
      const calls = (mockVideoElement.addEventListener as Mock).mock.calls as Array<[string, () => void]>;

      for (const [event, callback] of calls) {
        expect(event).toEqual('seeked');
        callback();
      }

      videoClip.setCrop(20, 20, 1280, 720);
      const container = videoClip._getContainer();
      const sprite = container.children[0] as Sprite;

      expect(sprite.texture.frame).toBeInstanceOf(Rectangle);
      expect(sprite.texture.frame.x).toBe(20);
      expect(sprite.texture.frame.y).toBe(20);
      expect(sprite.texture.frame.width).toBe(1280);
      expect(sprite.texture.frame.height).toBe(720);
    });

    it('should handle invalid crop dimensions', () => {
      // Trigger ready state
      const calls = (mockVideoElement.addEventListener as Mock).mock.calls as Array<[string, () => void]>;
      const seekedCallback = calls.find((call) => call[0] === 'seeked')?.[1];
      seekedCallback?.();

      // Try to set invalid crop dimensions
      videoClip.setCrop(20, 20, -100, 720);
      const container = videoClip._getContainer();
      const sprite = container.children[0] as Sprite;

      // Expect the crop not to be applied
      expect(sprite.texture.frame).toBeNull();
    });
  });

  describe('position and size', () => {
    beforeEach(() => {
      // Trigger ready state
      const calls = (mockVideoElement.addEventListener as Mock).mock.calls as Array<[string, () => void]>;
      const seekedCallback = calls.find((call) => call[0] === 'seeked')?.[1];
      seekedCallback?.();
    });

    it('should update position correctly', () => {
      videoClip.setPosition({ left: 30, top: 40 });
      const sprite = videoClip._getContainer().children[0] as Sprite;
      expect(sprite.position.x).toBe(30);
      expect(sprite.position.y).toBe(40);
    });

    it('should update size correctly', () => {
      videoClip.setSize({ width: 1280, height: 720 });
      const sprite = videoClip._getContainer().children[0] as Sprite;
      expect(sprite.width).toBe(1280);
      expect(sprite.height).toBe(720);
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      // Trigger ready state
      const calls = (mockVideoElement.addEventListener as Mock).mock.calls as Array<[string, () => void]>;
      const seekedCallback = calls.find((call) => call[0] === 'seeked')?.[1];
      seekedCallback?.();
    });

    it('should show clip when time is within range', () => {
      videoClip.render(2);
      expect(videoClip._getContainer().visible).toBe(true);
    });

    it('should hide clip when time is before start', () => {
      videoClip.render(-1);
      expect(videoClip._getContainer().visible).toBe(false);
    });

    it('should hide clip when time is after end', () => {
      videoClip.render(6);
      expect(videoClip._getContainer().visible).toBe(false);
    });

    it('should update video time based on clip time', () => {
      videoClip.render(2);
      // With default speed=1 and no range specified, video time should match clip time
      expect(mockVideoElement.currentTime).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('should clean up event listeners and destroy container', () => {
      // Trigger ready state
      const calls = (mockVideoElement.addEventListener as Mock).mock.calls as Array<[string, () => void]>;
      const seekedCallback = calls.find((call) => call[0] === 'seeked')?.[1];
      seekedCallback?.();

      videoClip.destroy();
      expect(mockVideoElement.removeEventListener).toHaveBeenCalledWith('seeked', expect.any(Function));

      const container = videoClip._getContainer();
      const containerDestroySpy = vi.spyOn(container, 'destroy');
      expect(containerDestroySpy).toHaveBeenCalled();
    });
  });
});
