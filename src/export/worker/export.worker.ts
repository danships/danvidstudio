import type { ExportWorkerMessage, ExportWorkerResponse } from './types';
import type { ExportProgress } from '../types';
import { WebCodecsEncoder } from '../web-codecs-encoder';
import { Container } from 'pixi.js';

let encoder: WebCodecsEncoder | null = null;

globalThis.onmessage = async (event: MessageEvent<ExportWorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT': {
      if (!payload || !('width' in payload)) {
        self.postMessage({
          type: 'ERROR',
          payload: { message: 'Invalid initialization payload' },
        } satisfies ExportWorkerResponse);
        return;
      }

      // Initialize encoder with required properties
      encoder = new WebCodecsEncoder({
        width: payload.width,
        height: payload.height,
        fps: payload.fps,
        duration: payload.duration,
        seek: () => {}, // No-op since we don't need seek in worker
      });
      self.postMessage({ type: 'INITIALIZED' } satisfies ExportWorkerResponse);
      break;
    }

    case 'ENCODE': {
      if (!encoder) {
        self.postMessage({
          type: 'ERROR',
          payload: { message: 'Encoder not initialized' },
        } satisfies ExportWorkerResponse);
        return;
      }

      if (!payload || !('options' in payload)) {
        self.postMessage({
          type: 'ERROR',
          payload: { message: 'Invalid encode payload' },
        } satisfies ExportWorkerResponse);
        return;
      }

      try {
        // Create an empty stage for the worker
        const stage = new Container();

        const blob = await encoder.encode(payload.options, stage, (progress: ExportProgress) => {
          self.postMessage({ type: 'PROGRESS', payload: progress } satisfies ExportWorkerResponse);
        });

        // Transfer the blob back to main thread
        self.postMessage(
          {
            type: 'COMPLETE',
            payload: { blob },
          } satisfies ExportWorkerResponse,
          { transfer: [blob] }
        );
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          payload: { message: error instanceof Error ? error.message : 'Unknown error' },
        } satisfies ExportWorkerResponse);
      }
      break;
    }

    case 'DISPOSE': {
      encoder?.dispose();
      encoder = null;
      self.postMessage({ type: 'DISPOSED' } satisfies ExportWorkerResponse);
      break;
    }
  }
};
