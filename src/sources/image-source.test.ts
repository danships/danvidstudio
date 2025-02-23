/* eslint-disable @typescript-eslint/unbound-method */
import { Texture } from 'pixi.js';
import { Assets } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { ImageSource } from './image-source';

// Mock Assets.load and URL.createObjectURL/revokeObjectURL
vi.mock('pixi.js', () => ({
  Assets: {
    load: vi.fn(),
  },
  Texture: {
    from: vi.fn(),
  },
}));

const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
globalThis.URL = {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
} as unknown as typeof globalThis.URL;

describe('ImageSource', () => {
  describe('create', () => {
    it('should create an ImageSource from a URL', async () => {
      const mockTexture = {
        width: 1920,
        height: 1080,
        destroy: vi.fn(),
      } as unknown as Texture;

      // Mock the Assets.load to return our mock texture
      vi.mocked(Assets.load).mockResolvedValue(mockTexture as unknown as Record<string, unknown>);

      const url = 'test-image.png';
      const imageSource = await ImageSource.create(url);

      expect(imageSource).toBeInstanceOf(ImageSource);
      expect(imageSource._texture).toBe(mockTexture);
      expect(imageSource.width).toBe(mockTexture.width);
      expect(imageSource.height).toBe(mockTexture.height);
      expect(Assets.load).toHaveBeenCalledWith(url);
    });

    it('should create an ImageSource from a blob URL string', async () => {
      const mockBlobUrl = 'blob:http://localhost:3000/1234-5678';
      const mockTexture = {
        width: 1920,
        height: 1080,
        destroy: vi.fn(),
      } as unknown as Texture;

      vi.mocked(Texture.from).mockReturnValue(mockTexture);

      // Create a spy for Image
      const mockImage = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'load') {
            setTimeout(() => handler(), 0);
          }
        }),
        src: '',
      };
      vi.spyOn(globalThis, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      const imageSource = await ImageSource.create(mockBlobUrl);

      expect(imageSource).toBeInstanceOf(ImageSource);
      expect(imageSource._texture).toBe(mockTexture);
      expect(imageSource.width).toBe(mockTexture.width);
      expect(imageSource.height).toBe(mockTexture.height);
      // Should not create or revoke object URL since we're passing a blob URL directly
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });

    it('should handle errors when creating from a blob URL string', async () => {
      const mockBlobUrl = 'blob:http://localhost:3000/1234-5678';

      // Create a spy for Image that triggers error
      const mockImage = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'error') {
            setTimeout(() => handler(), 0);
          }
        }),
        src: '',
      };
      vi.spyOn(globalThis, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      await expect(ImageSource.create(mockBlobUrl)).rejects.toThrow('Failed to load image');
      // Should not create or revoke object URL since we're passing a blob URL directly
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });

    it('should create an ImageSource from a Blob', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const mockObjectUrl = 'blob:test-url';
      const mockTexture = {
        width: 1920,
        height: 1080,
        destroy: vi.fn(),
      } as unknown as Texture;

      mockCreateObjectURL.mockReturnValue(mockObjectUrl);
      vi.mocked(Texture.from).mockReturnValue(mockTexture);

      // Create a spy for Image
      const mockImage = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'load') {
            setTimeout(() => handler(), 0);
          }
        }),
        src: '',
      };
      vi.spyOn(globalThis, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      const imageSource = await ImageSource.create(mockBlob);

      expect(imageSource).toBeInstanceOf(ImageSource);
      expect(imageSource._texture).toBe(mockTexture);
      expect(imageSource.width).toBe(mockTexture.width);
      expect(imageSource.height).toBe(mockTexture.height);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockObjectUrl);
    });

    it('should create an ImageSource from a File', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      const mockObjectUrl = 'blob:test-url';
      const mockTexture = {
        width: 1920,
        height: 1080,
        destroy: vi.fn(),
      } as unknown as Texture;

      mockCreateObjectURL.mockReturnValue(mockObjectUrl);
      vi.mocked(Texture.from).mockReturnValue(mockTexture);

      // Create a spy for Image
      const mockImage = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'load') {
            setTimeout(() => handler(), 0);
          }
        }),
        src: '',
      };
      vi.spyOn(globalThis, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      const imageSource = await ImageSource.create(mockFile);

      expect(imageSource).toBeInstanceOf(ImageSource);
      expect(imageSource._texture).toBe(mockTexture);
      expect(imageSource.width).toBe(mockTexture.width);
      expect(imageSource.height).toBe(mockTexture.height);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockObjectUrl);
    });

    it('should handle Blob/File loading errors', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/png' });
      const mockObjectUrl = 'blob:test-url';

      mockCreateObjectURL.mockReturnValue(mockObjectUrl);

      // Create a spy for Image that triggers error
      const mockImage = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'error') {
            setTimeout(() => handler(), 0);
          }
        }),
        src: '',
      };
      vi.spyOn(globalThis, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      await expect(ImageSource.create(mockBlob)).rejects.toThrow('Failed to load image');
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockObjectUrl);
    });

    it('should throw an error if image loading fails', async () => {
      const error = new Error('Failed to load image');
      vi.mocked(Assets.load).mockRejectedValue(error);

      const url = 'invalid-image.png';
      await expect(ImageSource.create(url)).rejects.toThrow('Failed to load image');
    });
  });

  describe('cleanup', () => {
    it('should destroy texture and clear reference', async () => {
      const mockTexture = { width: 1920, height: 1080, destroy: vi.fn() } as unknown as Texture;
      // Mock successful texture loading
      vi.mocked(Assets.load).mockResolvedValue(mockTexture as unknown as Record<string, unknown>);

      const imageSource = await ImageSource.create('test-image.png');
      imageSource.destroy();

      expect(mockTexture.destroy).toHaveBeenCalledWith(true);
    });
  });
});
