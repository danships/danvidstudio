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
  interface MockVideoElement extends HTMLVideoElement {
    _videoWidth: number;
    _videoHeight: number;
  }

  let mockVideoElement: MockVideoElement;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock video element with getters for read-only properties
    const mockElement = {
      muted: false,
      playsInline: false,
      loop: true,
      preload: '',
      crossOrigin: null,
      src: '',
      get videoWidth() {
        return this._videoWidth;
      },
      get videoHeight() {
        return this._videoHeight;
      },
      _videoWidth: 1920,
      _videoHeight: 1080,
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
    };

    mockVideoElement = mockElement as unknown as MockVideoElement;

    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockImplementation(() => mockVideoElement);
  });

  describe('create', () => {
    it('should create a VideoSource instance from URL with correct properties', async () => {
      const url = 'test-video.mp4';
      const source = await VideoSource.create(url);

      expect(source).toBeInstanceOf(VideoSource);
      expect(source.getSize()).toEqual({
        width: mockVideoElement.videoWidth,
        height: mockVideoElement.videoHeight,
      });
      expect(source.getDuration()).toBe(mockVideoElement.duration);
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockVideoElement.src).toBe(url);
    });

    it('should create a VideoSource instance from Blob with correct properties', async () => {
      const mockBlob = new Blob(['test'], { type: 'video/mp4' });
      const mockObjectUrl = 'blob:test-url';
      mockCreateObjectURL.mockReturnValue(mockObjectUrl);

      const source = await VideoSource.create(mockBlob);

      expect(source).toBeInstanceOf(VideoSource);
      expect(source.getSize()).toEqual({
        width: mockVideoElement.videoWidth,
        height: mockVideoElement.videoHeight,
      });
      expect(source.getDuration()).toBe(mockVideoElement.duration);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockVideoElement.src).toBe(mockObjectUrl);
    });

    it('should create a VideoSource instance from File with correct properties', async () => {
      const mockFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      const mockObjectUrl = 'blob:test-url';
      mockCreateObjectURL.mockReturnValue(mockObjectUrl);

      const source = await VideoSource.create(mockFile);

      expect(source).toBeInstanceOf(VideoSource);
      expect(source.getSize()).toEqual({
        width: mockVideoElement.videoWidth,
        height: mockVideoElement.videoHeight,
      });
      expect(source.getDuration()).toBe(mockVideoElement.duration);
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

  describe('getSize', () => {
    it('should return correct size from video dimensions', async () => {
      const source = await VideoSource.create('test-video.mp4');
      const size = source.getSize();

      expect(size).toEqual({
        width: mockVideoElement.videoWidth,
        height: mockVideoElement.videoHeight,
      });
    });

    it('should maintain size after video operations', async () => {
      const source = await VideoSource.create('test-video.mp4');
      const initialSize = source.getSize();

      // Perform some operations
      source.getVideoElement().currentTime = 5;

      const finalSize = source.getSize();
      expect(finalSize).toEqual(initialSize);
    });

    it('should return correct size for different video dimensions', async () => {
      // Change mock video dimensions
      mockVideoElement._videoWidth = 3840;
      mockVideoElement._videoHeight = 2160;

      const source = await VideoSource.create('test-video.mp4');
      const size = source.getSize();

      expect(size).toEqual({
        width: 3840,
        height: 2160,
      });
    });
  });
});
