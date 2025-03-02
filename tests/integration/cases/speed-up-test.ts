import { Composition, VideoClip, VideoSource } from '../../..';
import type { ManualTestCase } from '../test-runner';

export const speedUpTest: ManualTestCase = {
  key: 'speed-up',
  name: 'Speed Up',
  description: 'Shows a video that plays a countdown from 10 at double speed.',
  expectedBehavior: 'You should see a video plays at double speed.',
  setup: async (testContainer: HTMLDivElement) => {
    const composition = await Composition.create({
      size: { width: 640, height: 480 },
      backgroundColor: '#000000',
    });

    const scene = composition.createScene({ duration: 5.1 });
    const track = scene.createTrack({});

    const countdownSource = await VideoSource.create('/countdown.webm');
    const countdownClip = new VideoClip({
      id: 'countdown',
      source: countdownSource,
      offset: 0,
      duration: 5.1,
      speed: 2,
    });

    track.addClip(countdownClip);

    composition.attachPlayer(testContainer);
    composition.play();

    return composition;
  },
  run: async ({ confirm, sleep }) => {
    await sleep(5100);
    return confirm('Did you see the numbers counting down from 10 at double speed?');
  },
};
