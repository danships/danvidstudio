import { renderDebug } from './debug';

export { Composition } from './composition/composition';
export type { CompositionEvents, CompositionUpdateListener, TimeUpdateListener } from './composition/composition';
export { Scene, type SceneOptions } from './composition/scene';
export { Track, type TrackOptions } from './composition/track';
export { VideoClip, type VideoClipOptions } from './clips/video-clip';
export { ImageClip, type ImageClipOptions } from './clips/image-clip';
export { TextClip, type TextClipOptions } from './clips/text-clip';
export { VideoSource } from './sources/video-source';
export { ImageSource } from './sources/image-source';
export { ExportManager } from './export/export-manager';
export { WebCodecsEncoder } from './export/web-codecs-encoder';
export { type Size, type Position, type Crop, ClipType } from './types';
export { type Clip } from './base/clip';
export { VisualClip } from './base/visual-clip';

export const debug = { renderDebug };
