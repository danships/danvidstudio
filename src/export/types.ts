import type { Container, ContainerChild } from 'pixi.js';

export interface ExportOptions {
  format: 'mp4' | 'webm';
  fps?: number;
  codec?: 'h264' | 'vp8' | 'vp9'; // TODO have different codecs for each container format
  bitrate?: number;
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
