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
      const imageSource = await ImageSource.create('test-image.png');

      imageSource.destroy();

      expect(mockTexture.destroy).toHaveBeenCalledWith(true);
    });
  });
});
