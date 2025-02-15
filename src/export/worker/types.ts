import type { ExportOptions, ExportProgress } from '../types';

export interface ExportWorkerMessage {
  type: 'INIT' | 'ENCODE' | 'DISPOSE';
  payload:
    | {
        width: number;
        height: number;
        fps: number;
        duration: number;
      }
    | {
        options: ExportOptions;
      }
    | undefined;
}

export interface ExportWorkerResponse {
  type: 'INITIALIZED' | 'PROGRESS' | 'COMPLETE' | 'ERROR' | 'DISPOSED';
  payload?: ExportProgress | { blob: Blob } | { message: string };
}
