import { Composition, ImageClip, ImageSource } from '../../..';
import type { ManualTestCase } from '../test-runner';

export const displayOrderTest: ManualTestCase = {
  key: 'display-order',
  name: 'Display Order',
  description: 'Tests changing display order of scenes, tracks and clips',
  expectedBehavior:
    'You should see two images overlapping. The order of which image appears on top will change during playback.',
  setup: async (testContainer: HTMLDivElement): Promise<Composition> => {
    const composition = await Composition.create({ size: { width: 640, height: 480 }, backgroundColor: '#000000' });

    // Load image sources
    const backdropSource = await ImageSource.create('/backdrop.jpg');
    const clipperSource = await ImageSource.create('/clipper.jpg');

    // Create first scene with backdrop on top
    const scene1 = composition.createScene({ duration: 1 });
    const track1 = scene1.addTrack({});
    const track2 = scene1.addTrack({});

    const backdropClip1 = new ImageClip({
      source: backdropSource,
      duration: 1,
      size: { width: 640, height: 480 },
    });
    const clipperClip1 = new ImageClip({
      source: clipperSource,
      duration: 1,
      size: { width: 320, height: 240 },
      position: { left: 160, top: 120 },
    });

    track1.addClip(backdropClip1);
    track2.addClip(clipperClip1);

    composition.attachPlayer(testContainer);

    return composition;
  },
  run: async ({ confirm, sleep, composition }) => {
    // Check first scene (clipper below backdrop)
    composition?.seek(0.5);
    await sleep(500);

    const firstSceneCorrect = confirm('Is the clipper on top of the backdrop?');
    if (!firstSceneCorrect) {
      return false;
    }

    // flip the scene order
    composition?.getScenes()[0]?.getTracks()[1]?.setDisplayOrder(0);
    await sleep(100);

    const secondSceneCorrect = confirm('Has the order changed? The clipper should now be hidden behind the backdrop.');
    if (!secondSceneCorrect) {
      return false;
    }

    return true;
  },
};
