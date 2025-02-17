/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoSource } from './video-source';

describe('VideoSource', () => {
  let mockVideoElement: HTMLVideoElement;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock video element
    mockVideoElement = {
      muted: false,
      playsInline: false,
      loop: false,
      preload: '',
      crossOrigin: null,
      src: '',
      videoWidth: 1920,
      videoHeight: 1080,
      duration: 10,
      currentTime: 0,
      pause: vi.fn(),
      remove: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        // Simulate metadata loaded
        if (event === 'loadedmetadata') {
          setTimeout(() => handler(), 0);
        }
        // Simulate data loaded
        if (event === 'loadeddata') {
          setTimeout(() => handler(), 0);
        }
        // Simulate seeked
        if (event === 'seeked') {
          setTimeout(() => handler(), 0);
        }
      }),
    } as unknown as HTMLVideoElement;

    // Mock document.createElement
    globalThis.document.createElement = vi.fn(() => mockVideoElement);
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  describe('create', () => {
    it('should create a VideoSource instance with correct properties', async () => {
      const url = 'test-video.mp4';
      const source = await VideoSource.create(url);

      expect(source).toBeInstanceOf(VideoSource);
      expect(source.url).toBe(url);
      expect(source.width).toBe(mockVideoElement.videoWidth);
      expect(source.height).toBe(mockVideoElement.videoHeight);
      expect(source.duration).toBe(mockVideoElement.duration);
    });

    it('should set correct video element properties', async () => {
      const url = 'test-video.mp4';
      const source = await VideoSource.create(url);
      const videoElement = source.getVideoElement();

      expect(videoElement.playsInline).toBe(true);
      expect(videoElement.muted).toBe(true);
      expect(videoElement.loop).toBe(false);
      expect(videoElement.preload).toBe('auto');
      expect(videoElement.crossOrigin).toBe('anonymous');
    });

    it('should handle video loading errors', async () => {
      mockVideoElement.addEventListener = vi.fn((event, handler) => {
        if (event === 'error') {
          setTimeout(() => handler(new Error('Video loading failed')), 0);
        }
      });

      const url = 'invalid-video.mp4';
      await expect(VideoSource.create(url)).rejects.toThrow('Failed to load video');
    });
  });

  describe('getVideoElement', () => {
    it('should return the video element', async () => {
      const source = await VideoSource.create('test-video.mp4');
      const videoElement = source.getVideoElement();

      expect(videoElement).toBe(mockVideoElement);
    });
  });

  describe('destroy', () => {
    it('should clean up video resources', async () => {
      const source = await VideoSource.create('test-video.mp4');
      source.destroy();

      expect(mockVideoElement.pause).toHaveBeenCalled();
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(mockVideoElement.src);
      expect(mockVideoElement.remove).toHaveBeenCalled();
    });
  });
});
