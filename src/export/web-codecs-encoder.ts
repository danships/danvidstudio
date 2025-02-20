import { ArrayBufferTarget as MP4ArrayBufferTarget, Muxer as MP4Muxer } from 'mp4-muxer';
import type { Container, ContainerChild } from 'pixi.js';
import { WebGLRenderer } from 'pixi.js';
import { ArrayBufferTarget as WebMArrayBufferTarget, Muxer as WebMMuxer } from 'webm-muxer';
import type { CompositionVideoEncoder, ExportOptions, ProgressCallback } from './types';
import type { Composition } from '../composition/composition';
import { logger } from '../utils/logger';

export class WebCodecsEncoder implements CompositionVideoEncoder {
  private readonly width: number;
  private readonly height: number;
  private readonly fps: number;
  private readonly duration: number;
  private readonly seek: (time: number) => void;
  private renderer: WebGLRenderer | null = null;

  constructor(composition: Composition) {
    logger.debug('WebCodecsEncoder constructor called', {
      width: composition.getSize().width,
      height: composition.getSize().height,
      fps: composition.getFps(),
      duration: composition.getDuration(),
    });

    this.width = composition.getSize().width;
    this.height = composition.getSize().height;
    this.fps = composition.getFps();
    this.duration = composition.getDuration();
    this.seek = (time: number) => composition.seek(time);

    void this.initRenderer();
  }

  private async initRenderer() {
    const renderer = new WebGLRenderer();
    await renderer.init({
      width: this.width,
      height: this.height,
      backgroundAlpha: 0,
      antialias: true,
      clearBeforeRender: true,
    });
    this.renderer = renderer;
  }

  private async renderFrame(time: number, stage: Container<ContainerChild>): Promise<VideoFrame> {
    if (!this.renderer) {
      throw new Error('Renderer not initialized');
    }

    // Update composition to specific time
    this.seek(time);

    // Render the frame
    this.renderer.render(stage);

    // Get the canvas from the renderer
    const canvas = this.renderer.view.canvas as HTMLCanvasElement;
    const bitmap = await createImageBitmap(canvas);

    // Create and return video frame
    return new VideoFrame(bitmap, {
      timestamp: time * 1_000_000, // Convert to microseconds
      duration: 1_000_000 / (this.fps || 30),
    });
  }

  private initWebMMuxer(fps: number) {
    return new WebMMuxer({
      target: new WebMArrayBufferTarget(),
      video: {
        codec: 'V_VP9',
        width: this.width,
        height: this.height,
        frameRate: fps,
      },
    });
  }

  private initMP4Muxer(fps: number) {
    return new MP4Muxer({
      target: new MP4ArrayBufferTarget(),
      fastStart: 'in-memory',
      video: {
        codec: 'avc',
        width: this.width,
        height: this.height,
        frameRate: fps,
      },
    });
  }

  public async encode(
    options: ExportOptions,
    stage: Container<ContainerChild>,
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    if (!this.renderer) {
      await this.initRenderer();
    }

    if (!this.renderer) {
      throw new Error('Failed to initialize renderer');
    }

    const fps = options.fps ?? 30;
    const totalFrames = Math.ceil(this.duration * fps);
    const format = options.format ?? 'webm';

    logger.debug('Starting video export', {
      fps,
      totalFrames,
      width: this.width,
      height: this.height,
      format,
    });

    // Initialize appropriate muxer based on format
    const muxer = format === 'mp4' ? this.initMP4Muxer(fps) : this.initWebMMuxer(fps);

    // Initialize video encoder with format-specific configuration
    const encoder = new VideoEncoder({
      output: (chunk, meta) => {
        try {
          muxer.addVideoChunk(chunk, meta);
        } catch (error) {
          logger.error('Error adding video chunk:', error);
          throw error;
        }
      },
      error: (error) => logger.error('Encoder error:', error),
    });

    let encoderClosed = false;

    encoder.configure({
      codec: format === 'mp4' ? 'avc1.42001f' : 'vp09.00.10.08',
      width: this.width,
      height: this.height,
      bitrate: options.bitrate ?? 5_000_000,
      framerate: fps,
    });

    try {
      // Process frames
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        const time = frameIndex / fps;

        // Render and encode one frame at a time
        try {
          const frame = await this.renderFrame(time, stage);
          const keyFrame = frameIndex % 150 === 0; // Key frame every 5 seconds at 30fps

          try {
            encoder.encode(frame, { keyFrame });
          } finally {
            frame.close();
          }

          onProgress?.({
            currentFrame: frameIndex,
            totalFrames,
            percentage: (frameIndex / totalFrames) * 100,
          });
        } catch (error) {
          logger.error('Error processing frame:', error);
          throw error;
        }
      }

      logger.debug('Finished encoding frames, flushing encoder');

      // Finish encoding
      await encoder.flush();
      encoder.close();
      encoderClosed = true;

      // Finalize the file
      logger.debug(`Finalizing ${format} file`);
      muxer.finalize();
      const buffer =
        format === 'mp4'
          ? (muxer.target as MP4ArrayBufferTarget).buffer
          : (muxer.target as WebMArrayBufferTarget).buffer;

      logger.debug('Export complete, buffer size:', buffer.byteLength);
      return new Blob([buffer], { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });
    } catch (error) {
      logger.error('Export error:', error);
      throw error;
    } finally {
      if (!encoderClosed) {
        try {
          encoder.close();
        } catch (error) {
          logger.debug('Error during encoder cleanup:', error);
        }
      }
    }
  }

  public dispose() {
    this.renderer?.destroy();
  }
}
