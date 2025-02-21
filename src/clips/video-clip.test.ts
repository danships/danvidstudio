/* eslint-disable @typescript-eslint/unbound-method */
import type { Container, Sprite } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoClip, type VideoClipOptions } from './video-clip';
import type { VideoSource } from '../sources/video-source';
import { ClipType } from '../types';

// Mock video element
const createMockVideoElement = () => {
  const mockElement = {
    autoplay: false,
    muted: false,
    currentTime: 0,
    remove: vi.fn(),
    addEventListener: vi.fn((event, callback) => {
      if (event === 'seeked') {
        // Immediately trigger the seeked event
        callback();
      }
    }),
    removeEventListener: vi.fn(),
  };

  const element = {
    ...mockElement,
    cloneNode: vi.fn().mockReturnValue({
      ...mockElement,
      addEventListener: vi.fn((event, callback) => {
        if (event === 'seeked') {
          // Immediately trigger the seeked event for cloned elements too
          callback();
        }
      }),
    }),
  } as unknown as HTMLVideoElement;

  return element;
};

// Mock video source
const createMockVideoSource = (duration: number = 10) => {
  const videoElement = createMockVideoElement();
  return {
    duration,
    getVideoElement: vi.fn().mockReturnValue(videoElement),
  } as unknown as VideoSource;
};

// Mock Container
const createMockContainer = () => {
  const container = {
    addChild: vi.fn(),
    removeChild: vi.fn(),
    destroy: vi.fn(),
  };
  return container as unknown as Container;
};

// Mock Sprite
const createMockSprite = () => {
  const sprite = {
    width: 0,
    height: 0,
    position: {
      set: vi.fn(),
    },
    texture: null,
    destroy: vi.fn(),
  };
  return sprite as unknown as Sprite;
};

// Mock PIXI VideoSource
const createMockPixiVideoSource = () => {
  return {
    width: 1920,
    height: 1080,
    destroy: vi.fn(),
  };
};

// Mock Texture
const createMockTexture = (source: VideoSource) => {
  return {
    source: {
      ...source,
      width: 1920,
      height: 1080,
    },
    frame: null,
    destroy: vi.fn(),
  };
};

// Mock PIXI
vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  return {
    ...actual,
    VideoSource: vi.fn().mockImplementation(() => createMockPixiVideoSource()),
    Texture: vi.fn().mockImplementation((options) => {
      if (options?.source) {
        // Handle texture creation with frame
        return createMockTexture(options.source);
      }
      // Handle texture creation with video source
      return createMockTexture(options);
    }),
    Sprite: vi.fn().mockImplementation(() => createMockSprite()),
    Container: vi.fn().mockImplementation(() => createMockContainer()),
    Rectangle: vi.fn().mockImplementation((x, y, width, height) => ({
      x,
      y,
      width,
      height,
    })),
  };
});

describe('VideoClip', () => {
  let videoSource: VideoSource;
  let videoClip: VideoClip;
  let defaultOptions: VideoClipOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    videoSource = createMockVideoSource();
    defaultOptions = {
      source: videoSource,
      position: { left: 0, top: 0 },
      size: { width: 1920, height: 1080 },
    };
  });

  it('should initialize with default options', () => {
    videoClip = new VideoClip(defaultOptions);
    expect(videoClip).toBeDefined();
    expect(videoClip.ready).toBe(true); // Should be true because we auto-trigger seeked event
  });

  it('should initialize with custom range', () => {
    const options = {
      ...defaultOptions,
      range: { start: 2, end: 8 },
    };
    videoClip = new VideoClip(options);
    expect(videoClip).toBeDefined();
  });

  it('should throw error for invalid range', () => {
    const options = {
      ...defaultOptions,
      range: { start: 8, end: 2 }, // Invalid range
    };
    expect(() => new VideoClip(options)).toThrow('Invalid source range: start must be less than end');
  });

  it('should set crop', () => {
    videoClip = new VideoClip(defaultOptions);
    videoClip.setCrop(0, 0, 960, 540);
    // Crop is applied, no error thrown
    expect(videoClip).toBeDefined();
  });

  it('should handle invalid crop dimensions', () => {
    videoClip = new VideoClip(defaultOptions);
    videoClip.setCrop(0, 0, -100, 540); // Invalid width
    videoClip.setCrop(0, 0, 960, -100); // Invalid height
    // No error thrown, operation ignored
    expect(videoClip).toBeDefined();
  });

  it('should remove crop', () => {
    videoClip = new VideoClip(defaultOptions);
    videoClip.setCrop(0, 0, 960, 540);
    videoClip.removeCrop();
    // Crop is removed, no error thrown
    expect(videoClip).toBeDefined();
  });

  it('should set size', () => {
    videoClip = new VideoClip(defaultOptions);
    const newSize = { width: 1280, height: 720 };
    videoClip.setSize(newSize);
    expect(videoClip).toBeDefined();
  });

  it('should set position', () => {
    videoClip = new VideoClip(defaultOptions);
    const newPosition = { left: 100, top: 100 };
    videoClip.setPosition(newPosition);
    expect(videoClip).toBeDefined();
  });

  it('should get container', () => {
    videoClip = new VideoClip(defaultOptions);
    const container = videoClip._getContainer();
    expect(container).toBeDefined();
    expect(container.addChild).toBeDefined();
  });

  it('should map source time correctly', () => {
    const options = {
      ...defaultOptions,
      range: { start: 2, end: 8 },
      speed: 2,
    };
    videoClip = new VideoClip(options);
    // @ts-ignore - accessing private method for testing
    const sourceTime = videoClip['mapToSourceTime'](1);
    expect(sourceTime).toBeGreaterThanOrEqual(2);
    expect(sourceTime).toBeLessThanOrEqual(8);
  });

  it('should handle frame preloading', async () => {
    videoClip = new VideoClip(defaultOptions);
    // Mock the preload interval to be very short
    // @ts-ignore - accessing private property for testing
    videoClip['preloadInterval'] = 1;
    // @ts-ignore - accessing private method for testing
    await videoClip['preloadFrames'](0);
    // Preloading started, no error thrown
    expect(videoClip).toBeDefined();
  }, 1000); // Set timeout to 1 second

  it('should render at specific time', () => {
    videoClip = new VideoClip(defaultOptions);
    videoClip.render(1.5);
    // Frame rendered, no error thrown
    expect(videoClip).toBeDefined();
  });

  it('should find nearest frame', () => {
    videoClip = new VideoClip(defaultOptions);
    // @ts-ignore - accessing private method for testing
    const frameTime = videoClip['findNearestFrame'](1.5);
    expect(frameTime).toBeNull(); // No frames in buffer yet
  });

  it('should clean up resources on destroy', () => {
    videoClip = new VideoClip(defaultOptions);
    videoClip.destroy();
    // @ts-ignore - accessing private property for testing
    expect(videoClip['sprite'].destroy).toHaveBeenCalled();
    // @ts-ignore - accessing private property for testing
    expect(videoClip['videoSource'].destroy).toHaveBeenCalled();
  });

  it('should handle seeked event', () => {
    videoClip = new VideoClip(defaultOptions);
    // @ts-ignore - accessing private property for testing
    videoClip['pendingSeek'] = true;
    // @ts-ignore - accessing private property for testing
    videoClip['seekedListener']();
    // @ts-ignore - accessing private property for testing
    expect(videoClip['pendingSeek']).toBe(false);
  });

  describe('getType', () => {
    it('should return ClipType.VIDEO', () => {
      expect(videoClip.getType()).toBe(ClipType.VIDEO);
    });
  });
});
