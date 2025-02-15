import type { Container, ContainerChild } from 'pixi.js';
import type { CompositionVideoEncoder, ExportOptions, ProgressCallback } from './types';
import { WebCodecsEncoder } from './web-codecs-encoder';
import type { Composition } from '../composition/composition';
import { logger } from '../utils/logger';

export class ExportManager {
  private readonly composition: Composition;
  private ready: Promise<void>;

  constructor(composition: Composition) {
    if (!composition || typeof composition !== 'object') {
      throw new Error('ExportManager: Composition is required');
    }

    logger.debug('ExportManager constructor called', {
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      duration: composition.duration,
    });

    // Bind the composition to ensure methods don't lose context
    this.composition = Object.create(composition, {
      seek: { value: composition.seek.bind(composition) },
    });
    this.ready = this.composition.ready;
  }

  public async export(
    options: ExportOptions,
    stage: Container<ContainerChild>,
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    logger.debug('Export started, waiting for ready state');
    await this.ready;

    // Check browser support
    if (!('VideoEncoder' in globalThis)) {
      throw new Error('WebCodecs API is not supported in this browser');
    }

    try {
      if (!this.composition || typeof this.composition !== 'object') {
        throw new Error('Composition reference lost');
      }

      logger.debug('Creating encoder', {
        width: this.composition.width,
        height: this.composition.height,
        fps: this.composition.fps,
        duration: this.composition.duration,
      });

      // Always use WebCodecsEncoder directly for now
      const encoder = new WebCodecsEncoder(this.composition);

      logger.debug('Starting encode process');
      const result = await encoder.encode(options, stage, onProgress);
      encoder.dispose();
      return result;
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  dispose() {
    // Nothing to dispose since encoder is created per export
  }
}
