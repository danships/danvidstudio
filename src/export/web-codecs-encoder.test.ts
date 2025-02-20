/* eslint-disable @typescript-eslint/no-explicit-any */
import { Container } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebCodecsEncoder } from './web-codecs-encoder';
import type { Composition } from '../composition/composition';

// Mock VideoEncoder
const createMockVideoEncoder = () => {
  return class MockVideoEncoder {
    public output: (chunk: any, meta: any) => void;
    public error: (error: Error) => void;

    constructor({ output, error }: { output: (chunk: any, meta: any) => void; error: (errorCallback: Error) => void }) {
      this.output = output;
      this.error = error;
    }

    public configure = vi.fn();

    // eslint-disable-next-line unicorn/consistent-function-scoping
    public encode = vi.fn().mockImplementation(() => {
      // Simulate encoder output
      this.output({ type: 'key' }, { decoderConfig: { description: new Uint8Array() } });
    });

    // eslint-disable-next-line unicorn/no-useless-undefined
    public flush = vi.fn().mockResolvedValue(undefined);
    public close = vi.fn();
  };
};

// Mock VideoFrame
class MockVideoFrame {
  public close = vi.fn();
  constructor(
    public image: ImageBitmap,
    public options: any
  ) {}
}

// Mock createImageBitmap
const mockCreateImageBitmap = vi.fn().mockResolvedValue({});

// Mock WebM muxer
const mockWebMMuxer = {
  addVideoChunk: vi.fn(),
  finalize: vi.fn(),
  target: {
    buffer: new ArrayBuffer(0),
  },
};

// Mock MP4 muxer
const mockMP4Muxer = {
  addVideoChunk: vi.fn(),
  finalize: vi.fn(),
  target: {
    buffer: new ArrayBuffer(0),
  },
};

vi.mock('webm-muxer', () => ({
  Muxer: vi.fn().mockImplementation(() => mockWebMMuxer),
  ArrayBufferTarget: vi.fn(),
}));

vi.mock('mp4-muxer', () => ({
  Muxer: vi.fn().mockImplementation(() => mockMP4Muxer),
  ArrayBufferTarget: vi.fn(),
}));

// Mock renderer instance that will be used across tests
const mockRenderer = {
  // eslint-disable-next-line unicorn/no-useless-undefined
  init: vi.fn().mockResolvedValue(undefined),
  render: vi.fn(),
  destroy: vi.fn(),
  view: {
    canvas: document.createElement('canvas'),
  },
};

vi.mock('pixi.js', () => ({
  WebGLRenderer: vi.fn().mockImplementation(() => mockRenderer),
  Container: vi.fn(),
}));

// Mock composition
const mockComposition = {
  getSize: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
  getFps: vi.fn().mockReturnValue(30),
  getDuration: vi.fn().mockReturnValue(10),
  seek: vi.fn(),
} as unknown as Composition;

describe('WebCodecsEncoder', () => {
  let encoder: WebCodecsEncoder;

  beforeEach(async () => {
    vi.clearAllMocks();
    // @ts-ignore VideoFrame type is not recognized
    globalThis.VideoFrame = MockVideoFrame;
    // @ts-ignore createImageBitmap type is not recognized
    globalThis.createImageBitmap = mockCreateImageBitmap;
    encoder = new WebCodecsEncoder(mockComposition);
    // Wait for renderer initialization
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  afterEach(() => {
    encoder.dispose();
  });

  it('should initialize with correct parameters', () => {
    expect(mockComposition.getSize).toHaveBeenCalled();
    expect(mockComposition.getFps).toHaveBeenCalled();
    expect(mockComposition.getDuration).toHaveBeenCalled();
  });

  it('should initialize renderer', () => {
    expect(mockRenderer.init).toHaveBeenCalledWith({
      width: 1920,
      height: 1080,
      backgroundAlpha: 0,
      antialias: true,
      clearBeforeRender: true,
    });
  });

  it('should encode WebM video', async () => {
    const stage = new Container();
    const onProgress = vi.fn();

    // @ts-ignore VideoEncoder type is not recognized
    globalThis.VideoEncoder = createMockVideoEncoder(mockWebMMuxer);

    const result = await encoder.encode({ format: 'webm', fps: 30, bitrate: 5_000_000 }, stage, onProgress);

    expect(result).toBeInstanceOf(Blob);
    expect(onProgress).toHaveBeenCalled();
    expect(mockWebMMuxer.addVideoChunk).toHaveBeenCalled();
    expect(mockWebMMuxer.finalize).toHaveBeenCalled();
  });

  it('should encode MP4 video', async () => {
    const stage = new Container();
    const onProgress = vi.fn();

    // @ts-ignore VideoEncoder type is not recognized
    globalThis.VideoEncoder = createMockVideoEncoder(mockMP4Muxer);

    const result = await encoder.encode({ format: 'mp4', fps: 30, bitrate: 5_000_000 }, stage, onProgress);

    expect(result).toBeInstanceOf(Blob);
    expect(onProgress).toHaveBeenCalled();
    expect(mockMP4Muxer.addVideoChunk).toHaveBeenCalled();
    expect(mockMP4Muxer.finalize).toHaveBeenCalled();
  });

  it('should handle encoding errors', async () => {
    const stage = new Container();
    const mockError = new Error('Encoding failed');

    // @ts-ignore VideoEncoder type is not recognized
    globalThis.VideoEncoder = vi.fn().mockImplementation(() => ({
      configure: vi.fn(),
      encode: vi.fn().mockImplementation(() => {
        throw mockError;
      }),
      flush: vi.fn(),
      close: vi.fn(),
    }));

    await expect(encoder.encode({ format: 'webm' }, stage)).rejects.toThrow(mockError);
  });

  it('should properly dispose resources', () => {
    encoder.dispose();
    expect(mockRenderer.destroy).toHaveBeenCalled();
  });
});
