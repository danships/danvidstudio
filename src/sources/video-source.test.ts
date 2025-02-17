/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoSource } from './video-source';

// Mock URL global
const mockRevokeObjectURL = vi.fn();
globalThis.URL = {
  revokeObjectURL: mockRevokeObjectURL,
} as unknown as typeof globalThis.URL;

describe('VideoSource', () => {
  let mockVideoElement: HTMLVideoElement;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock video element
    mockVideoElement = {
      muted: false,
      playsInline: false,
      loop: true,
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
        if (event === 'loadedmetadata' || event === 'loadeddata' || event === 'seeked') {
          // eslint-disable-next-line @typescript-eslint/no-implied-eval
          setTimeout(handler, 0);
        }
      }),
    } as unknown as HTMLVideoElement;

    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockImplementation(() => mockVideoElement);
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
    it('should properly clean up video resources', async () => {
      const url = 'test-video.mp4';
      const source = await VideoSource.create(url);
      const videoElement = source.getVideoElement();

      // Set a source URL to test revocation
      videoElement.src = 'blob:test-url';

      source.destroy();

      expect(videoElement.pause).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
      expect(videoElement.remove).toHaveBeenCalled();
    });

    it('should handle destroy when video has no source URL', async () => {
      const url = 'test-video.mp4';
      const source = await VideoSource.create(url);
      const videoElement = source.getVideoElement();

      // Clear the source URL
      videoElement.src = '';

      source.destroy();

      expect(videoElement.pause).toHaveBeenCalled();
      expect(mockRevokeObjectURL).not.toHaveBeenCalled(); // Should not try to revoke when no URL
      expect(videoElement.remove).toHaveBeenCalled();
    });
  });
});
