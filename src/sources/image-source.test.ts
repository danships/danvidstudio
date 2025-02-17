/* eslint-disable @typescript-eslint/unbound-method */
import type { Texture } from 'pixi.js';
import { Assets } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { ImageSource } from './image-source';

// Mock Assets.load
vi.mock('pixi.js', () => ({
  Assets: {
    load: vi.fn(),
  },
  Texture: vi.fn(),
}));

describe('ImageSource', () => {
  describe('constructor', () => {
    it('should create an ImageSource instance with correct properties', () => {
      const mockTexture = { width: 1920, height: 1080 } as Texture;
      const width = 1920;
      const height = 1080;

      const imageSource = new ImageSource(mockTexture, width, height);

      expect(imageSource).toBeInstanceOf(ImageSource);
      expect(imageSource._texture).toBe(mockTexture);
      expect(imageSource.width).toBe(width);
      expect(imageSource.height).toBe(height);
    });
  });

  describe('create', () => {
    it('should create an ImageSource from a URL', async () => {
      const mockTexture = {
        width: 1920,
        height: 1080,
      } as Texture;

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

    it('should throw an error if image loading fails', async () => {
      const error = new Error('Failed to load image');
      vi.mocked(Assets.load).mockRejectedValue(error);

      const url = 'invalid-image.png';
      await expect(ImageSource.create(url)).rejects.toThrow('Failed to load image');
    });
  });
});
