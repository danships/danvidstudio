import type { Container } from 'pixi.js';
import type { ContainerChild } from 'pixi.js';
import type { CompositionVideoEncoder, ExportOptions, ExportProgress, ProgressCallback } from './types';
// @ts-expect-error This is a vite specific import
import ExportWorker from './worker/export.worker?worker&inline';
import type { Composition } from '../composition/composition';
import { logger } from '../utils/logger';

interface ExportWorkerResponse {
  type: 'INITIALIZED' | 'PROGRESS' | 'COMPLETE' | 'ERROR';
  payload: ExportProgress | { type: 'COMPLETE'; blob: Blob } | { type: 'ERROR'; message: string };
}

export class WorkerVideoEncoder implements CompositionVideoEncoder {
  private worker: Worker;
  private readonly width: number;
  private readonly height: number;
  private readonly fps: number;
  private readonly duration: number;

  constructor(composition: Composition) {
    if (!composition || typeof composition !== 'object') {
      throw new Error('Composition is required');
    }

    logger.debug('WorkerVideoEncoder constructor called', {
      width: composition.width,
      height: composition.height,
      fps: composition.fps,
      duration: composition.duration,
    });

    // Store required properties
    this.width = composition.width;
    this.height = composition.height;
    this.fps = composition.fps;
    this.duration = composition.duration;

    this.worker = new ExportWorker();
  }

  public async encode(
    options: ExportOptions,
    _stage: Container<ContainerChild>,
    onProgress?: ProgressCallback
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = (event: MessageEvent<ExportWorkerResponse>) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'INITIALIZED': {
            // Start encoding once initialized
            this.worker.postMessage({
              type: 'ENCODE',
              payload: { options },
            });
            break;
          }

          case 'PROGRESS': {
            onProgress?.(payload as ExportProgress);
            break;
          }

          case 'COMPLETE': {
            resolve((payload as { type: 'COMPLETE'; blob: Blob }).blob);
            break;
          }

          case 'ERROR': {
            reject(new Error((payload as { type: 'ERROR'; message: string }).message));
            break;
          }
        }
      };

      // Initialize the worker with just the required properties
      this.worker.postMessage({
        type: 'INIT',
        payload: {
          width: this.width,
          height: this.height,
          fps: this.fps,
          duration: this.duration,
        },
      });
    });
  }

  dispose() {
    this.worker.postMessage({ type: 'DISPOSE' });
    this.worker.terminate();
  }
}
