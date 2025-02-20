import { Container } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExportManager } from './export-manager';
import { WebCodecsEncoder } from './web-codecs-encoder';
import type { Composition } from '../composition/composition';

// Create a properly typed mock encoder
const createMockEncoder = (overrides?: Partial<WebCodecsEncoder>) => {
  const mockEncoder = {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 10,
    seek: vi.fn(),
    renderer: null,
    encode: vi.fn().mockResolvedValue(new Blob()),
    dispose: vi.fn(),
    ...overrides,
  } as unknown as WebCodecsEncoder;
  return mockEncoder;
};

// Mock WebCodecsEncoder
vi.mock('./web-codecs-encoder', () => ({
  WebCodecsEncoder: vi.fn().mockImplementation(() => createMockEncoder()),
}));

describe('ExportManager', () => {
  let mockComposition: Composition;
  let exportManager: ExportManager;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock composition
    mockComposition = {
      getSize: vi.fn().mockReturnValue({ width: 1920, height: 1080 }),
      getFps: vi.fn().mockReturnValue(30),
      getDuration: vi.fn().mockReturnValue(10),
      // eslint-disable-next-line unicorn/no-useless-undefined
      waitForReady: vi.fn().mockResolvedValue(undefined),
    } as unknown as Composition;

    // Create export manager instance
    exportManager = new ExportManager(mockComposition);

    // Mock VideoEncoder global
    // @ts-ignore We mock it with an empty object
    globalThis.VideoEncoder = {};
  });

  it('should initialize with composition', () => {
    expect(() => new ExportManager(mockComposition)).not.toThrow();
    expect(mockComposition.getSize).toHaveBeenCalled();
    expect(mockComposition.getFps).toHaveBeenCalled();
    expect(mockComposition.getDuration).toHaveBeenCalled();
  });

  it('should wait for composition to be ready before exporting', async () => {
    const stage = new Container();
    const options = { format: 'webm' as const };

    await exportManager.export(options, stage);

    expect(mockComposition.waitForReady).toHaveBeenCalled();
  });

  it('should throw error if WebCodecs is not supported', async () => {
    const stage = new Container();
    const options = { format: 'webm' as const };

    // @ts-ignore We mock it with an empty object, VideoEncoder is not recognized as type
    delete globalThis.VideoEncoder;

    await expect(exportManager.export(options, stage)).rejects.toThrow(
      'WebCodecs API is not supported in this browser'
    );
  });

  it('should create encoder and handle export process', async () => {
    const stage = new Container();
    const options = { format: 'webm' as const };
    const onProgress = vi.fn();

    const result = await exportManager.export(options, stage, onProgress);

    expect(WebCodecsEncoder).toHaveBeenCalledWith(mockComposition);
    expect(result).toBeInstanceOf(Blob);
  });

  it('should handle export errors', async () => {
    const stage = new Container();
    const options = { format: 'webm' as const };
    const error = new Error('Export failed');

    // Mock encoder to throw error
    vi.mocked(WebCodecsEncoder).mockImplementationOnce(() =>
      createMockEncoder({
        encode: vi.fn().mockRejectedValue(error),
      })
    );

    await expect(exportManager.export(options, stage)).rejects.toThrow('Export failed: Export failed');
  });

  it('should handle non-Error export errors', async () => {
    const stage = new Container();
    const options = { format: 'webm' as const };

    // Mock encoder to throw non-Error
    vi.mocked(WebCodecsEncoder).mockImplementationOnce(() =>
      createMockEncoder({
        encode: vi.fn().mockRejectedValue('Some string error'),
      })
    );

    await expect(exportManager.export(options, stage)).rejects.toThrow('Export failed: Unknown error');
  });

  it('should throw error if composition reference is lost', async () => {
    const stage = new Container();
    const options = { format: 'webm' as const };

    // @ts-ignore - Simulate lost composition reference
    exportManager['composition'] = null;

    await expect(exportManager.export(options, stage)).rejects.toThrow('Export failed: Composition reference lost');
  });

  it('should dispose without errors', () => {
    expect(() => exportManager.dispose()).not.toThrow();
  });
});
