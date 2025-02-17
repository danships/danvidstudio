import { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { Scene } from './scene';
import { Track } from './track';
import type { VisualClip } from '../base/visual-clip';

// Mock VisualClip
const createMockClip = () =>
  ({
    id: 'mock-clip',
    _getContainer: () => new Container(),
    setTrack: vi.fn(),
    _setUpdated: vi.fn(),
    destroy: vi.fn(),
    render: vi.fn(),
  }) as unknown as VisualClip;

describe('Track', () => {
  let track: Track;
  let mockScene: Scene;
  let mockParentContainer: Container;
  let mockUpdated: Mock;

  beforeEach(() => {
    mockScene = {} as Scene;
    mockParentContainer = new Container();
    mockUpdated = vi.fn();

    track = new Track(mockScene, mockParentContainer, {
      id: 'test-track',
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
      const mockClip = createMockClip();
      track.addClip(mockClip);

      expect(mockClip.setTrack).toHaveBeenCalledWith(track);
      expect(mockClip._setUpdated).toHaveBeenCalledWith(mockUpdated);
      expect(mockUpdated).toHaveBeenCalled();
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
      // Add some clips
      const mockClip1 = createMockClip();
      const mockClip2 = createMockClip();
      track.addClip(mockClip1).addClip(mockClip2);

      // Get container to spy on its destroy method
      const container = track['container'];
      const containerDestroySpy = vi.spyOn(container, 'destroy');

      // Destroy track
      track.destroy();

      // Verify all clips were destroyed
      expect(mockClip1.destroy).toHaveBeenCalled();
      expect(mockClip2.destroy).toHaveBeenCalled();

      // Verify container was destroyed with children
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
});
