/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoSource } from './video-source';

// Mock URL global
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
globalThis.URL = {
  createObjectURL: mockCreateObjectURL,
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
    it('should create a VideoSource instance from URL with correct properties', async () => {
      const url = 'test-video.mp4';
      const source = await VideoSource.create(url);

      expect(source).toBeInstanceOf(VideoSource);
      expect(source.width).toBe(mockVideoElement.videoWidth);
      expect(source.height).toBe(mockVideoElement.videoHeight);
      expect(source.duration).toBe(mockVideoElement.duration);
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockVideoElement.src).toBe(url);
    });

    it('should create a VideoSource instance from Blob with correct properties', async () => {
      const mockBlob = new Blob(['test'], { type: 'video/mp4' });
      const mockObjectUrl = 'blob:test-url';
      mockCreateObjectURL.mockReturnValue(mockObjectUrl);

      const source = await VideoSource.create(mockBlob);

      expect(source).toBeInstanceOf(VideoSource);
      expect(source.width).toBe(mockVideoElement.videoWidth);
      expect(source.height).toBe(mockVideoElement.videoHeight);
      expect(source.duration).toBe(mockVideoElement.duration);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockVideoElement.src).toBe(mockObjectUrl);
    });

    it('should create a VideoSource instance from File with correct properties', async () => {
      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      const mockObjectUrl = 'blob:test-url';
      mockCreateObjectURL.mockReturnValue(mockObjectUrl);

      const source = await VideoSource.create(mockFile);

      expect(source).toBeInstanceOf(VideoSource);
      expect(source.width).toBe(mockVideoElement.videoWidth);
      expect(source.height).toBe(mockVideoElement.videoHeight);
      expect(source.duration).toBe(mockVideoElement.duration);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
      expect(mockVideoElement.src).toBe(mockObjectUrl);
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
    it('should properly clean up video resources with object URL', async () => {
      const mockBlob = new Blob(['test'], { type: 'video/mp4' });
      const mockObjectUrl = 'blob:test-url';
      mockCreateObjectURL.mockReturnValue(mockObjectUrl);

      const source = await VideoSource.create(mockBlob);
      source.destroy();

      expect(mockVideoElement.pause).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockObjectUrl);
      expect(mockVideoElement.remove).toHaveBeenCalled();
    });

    it('should properly clean up video resources with HTTP URL', async () => {
      const url = 'test-video.mp4';
      const source = await VideoSource.create(url);
      source.destroy();

      expect(mockVideoElement.pause).toHaveBeenCalled();
      expect(mockRevokeObjectURL).not.toHaveBeenCalled(); // Should not try to revoke when using HTTP URL
      expect(mockVideoElement.remove).toHaveBeenCalled();
    });
  });
});
