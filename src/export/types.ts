import type { Container, ContainerChild } from 'pixi.js';

export interface ExportOptions {
  format: 'mp4' | 'webm';
  codec?: 'h264' | 'vp8' | 'vp9';
  fps?: number;
  bitrate?: number;
  quality?: number; // 0-1
}

export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
}

export type ProgressCallback = (progress: ExportProgress) => void;

export interface CompositionVideoEncoder {
  encode(options: ExportOptions, stage: Container<ContainerChild>, onProgress?: ProgressCallback): Promise<Blob>;
  dispose(): void;
}
