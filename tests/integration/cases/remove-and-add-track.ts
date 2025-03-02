import { Composition, ImageClip, ImageSource, LogLevel } from '../../..';
import type { ManualTestCase } from '../test-runner';

export const removeAndAddTrackTest: ManualTestCase = {
  key: 'remove-and-add-track',
  name: 'Remove and Add Track',
  description: 'Tests removing a track from a scene and then adding it back',
  expectedBehavior:
    'You should see an image appear for 2 seconds, then disappear for 1 second, then appear again for 2 seconds',
  setup: async (testContainer: HTMLDivElement): Promise<Composition> => {
    const composition = await Composition.create({
      size: { width: 640, height: 480 },
      backgroundColor: '#000000',
      logLevel: LogLevel.DEBUG,
    });

    const clipper = await ImageSource.create('/clipper.jpg');
    const imageClip = new ImageClip({
      id: 'clipper',
      source: clipper,
      offset: 0,
      duration: 5,
      position: { left: 80, top: 10 },
      size: { width: 480, height: 460 },
    });

    const scene = composition.createScene({ duration: 5 });
    const track = scene.createTrack({ id: 'test-track' });
    track.addClip(imageClip);

    composition.attachPlayer(testContainer);
    composition.seek(0);

    return composition;
  },
  run: async ({ composition, confirm, sleep, openTab }) => {
    // first show the composition, then remove the track, and add it back
    openTab('pixitree');
    await sleep(500);
    const scene = composition?.getScenes()[0];
    const track = scene?.getTracks()[0];

    if (!track || !scene) {
      throw new Error('Track or Scene not found');
    }

    track.remove();
    await sleep(1000);
    const trackedRemoved = confirm('Is the image track removed?');

    scene.addTrack(track);

    await sleep(1000);
    return confirm('Did you see the image appear, disappear for 1 second, and then appear again?') && trackedRemoved;
  },
};
