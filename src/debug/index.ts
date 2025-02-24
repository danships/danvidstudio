import { DebugRenderer } from './debug-renderer';
import type { Composition } from '../composition/composition';

export function renderDebug(composition: Composition, container: HTMLElement): () => void {
  const renderer = new DebugRenderer(container, composition);
  renderer.startAutoUpdate();
  return () => renderer.stopAutoUpdate();
}
