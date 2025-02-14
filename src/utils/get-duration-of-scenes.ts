import type { Scene } from '../composition/scene';

export function getDurationOfScenes(scenes: Scene[]) {
  return scenes.reduce((accumulator, scene) => accumulator + scene.duration, 0);
}
