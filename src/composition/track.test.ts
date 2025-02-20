import { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { Scene } from './scene';
import { Track } from './track';
import type { VisualClip } from '../base/visual-clip';

// Mock VisualClip
const mockClipContainer = new Container();
const createMockClip = () =>
  ({
    id: 'mock-clip',
    destroy: vi.fn(),
    setTrack: vi.fn(),
    _setUpdated: vi.fn(),
    _getContainer: () => mockClipContainer,
    render: vi.fn(),
  }) as unknown as VisualClip;

describe('Track', () => {
  let track: Track;
  let mockScene: Scene;
  let mockParentContainer: Container;
  let mockUpdated: Mock;

  beforeEach(() => {
    mockParentContainer = new Container();
    mockUpdated = vi.fn();

    // Create a proper mock Scene
    mockScene = {
      id: 'mock-scene',
      tracks: [],
      _getContainer: () => mockParentContainer,
      render: vi.fn(),
      setVisible: vi.fn(),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      setDuration: vi.fn(),
      getDuration: vi.fn(),
      _setUpdated: vi.fn(),
      destroy: vi.fn(),
      getTracks: vi.fn(),
      addClip: vi.fn(),
    } as unknown as Scene;

    track = new Track(mockScene, {
      updated: mockUpdated,
    });
  });

  describe('initialization', () => {
    it('should create a track with container added to parent', () => {
      expect(track).toBeDefined();
      expect(mockParentContainer.children).toHaveLength(1);
      expect(mockParentContainer.children[0]).toBeInstanceOf(Container);
    });
  });

  describe('clip management', () => {
    it('should add clips correctly', () => {
      const clip = createMockClip();
      track.addClip(clip);

      expect(track['clips']).toHaveLength(1);
      expect(clip.setTrack).toHaveBeenCalledWith(track);
      expect(clip._setUpdated).toHaveBeenCalledWith(mockUpdated);
      expect(mockUpdated).toHaveBeenCalled();
    });

    it('should remove clips correctly', () => {
      const clip1 = createMockClip();
      const clip2 = createMockClip();

      track.addClip(clip1);
      track.addClip(clip2);
      expect(track['clips']).toHaveLength(2);

      // Remove one clip
      track.removeClip(clip1);
      expect(track['clips']).toHaveLength(1);
      expect(clip1.destroy).toHaveBeenCalled();
      expect(track['clips'][0]).toBe(clip2);

      // Try to remove non-existent clip (should not throw)
      track.removeClip(clip1);
      expect(track['clips']).toHaveLength(1);
    });

    it('should render all clips', () => {
      const mockClip1 = createMockClip();
      const mockClip2 = createMockClip();

      track.addClip(mockClip1).addClip(mockClip2);
      track.render(1.5);

      expect(mockClip1.render).toHaveBeenCalledWith(1.5);
      expect(mockClip2.render).toHaveBeenCalledWith(1.5);
    });
  });

  describe('cleanup', () => {
    it('should destroy all clips and container', () => {
      const clip1 = createMockClip();
      const clip2 = createMockClip();

      track.addClip(clip1);
      track.addClip(clip2);

      const containerDestroySpy = vi.spyOn(track['container'], 'destroy');

      track.destroy();

      expect(clip1.destroy).toHaveBeenCalled();
      expect(clip2.destroy).toHaveBeenCalled();
      expect(track['clips']).toHaveLength(0);
      expect(containerDestroySpy).toHaveBeenCalledWith({ children: true });
    });

    it('should clear clips array after destruction', () => {
      const mockClip = createMockClip();
      track.addClip(mockClip);

      track.destroy();

      // Access private clips array for testing
      expect(track['clips']).toHaveLength(0);
    });
  });

  describe('display order', () => {
    it('should set display order correctly', () => {
      const mockSetChildIndex = vi.fn();
      const mockParent = new Container();
      mockParent.setChildIndex = mockSetChildIndex;
      const trackContainer = track['container'];
      trackContainer.parent = mockParent;

      track.setDisplayOrder(2);
      expect(mockSetChildIndex).toHaveBeenCalledWith(trackContainer, 2);
    });
  });
});
