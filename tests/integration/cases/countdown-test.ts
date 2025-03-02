import { Composition, ImageClip, ImageSource, TextClip } from '../../..';
import type { ManualTestCase } from '../test-runner';

export const countdownTest: ManualTestCase = {
  key: 'countdown-animation',
  name: 'Countdown Animation',
  description: 'Shows a countdown from 10 to 0 with animated backgrounds',
  expectedBehavior:
    'You should see numbers counting down from 10 to 0, one per second, with shifting colored backgrounds.',
  setup: async (testContainer: HTMLDivElement): Promise<Composition> => {
    const composition = await Composition.create({
      size: { width: 640, height: 480 },
      backgroundColor: '#000000',
    });

    // Create a scene that will last 11 seconds (10 to 0)
    const scene = composition.createScene({ duration: 10.1 });
    const track = scene.createTrack({});

    const backdropImage = await ImageSource.create('/backdrop.jpg');

    // Create 11 text clips (10 to 0)
    for (let iter = 10; iter >= 0; iter--) {
      const offset = (10 - iter) * 20; // Increasing offset for background

      // Create background clip with shifting colors
      const backgroundClip = new ImageClip({
        id: `background-${iter}`,
        source: backdropImage,
        offset: 10 - iter,
        duration: 1,
        crop: {
          left: 220 + offset,
          top: 140 + offset,
          width: 640,
          height: 480,
        },
      });

      // Create number clip
      const textClip = new TextClip({
        id: `number-${iter}`,
        style: {
          fontSize: 160,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fill: '#FFFFFF',
        },
        text: iter.toString(),
        offset: 10 - iter,
        duration: 1,
        position: {
          left: 245,
          top: 180,
        },
      });

      if (iter === 0) {
        textClip.setDuration(0.1);
        backgroundClip.setDuration(0.1);
      }
      track.addClip(backgroundClip);
      track.addClip(textClip);
    }

    composition.attachPlayer(testContainer);
    composition.play();

    return composition;
  },
  run: async ({ confirm, sleep }) => {
    await sleep(11_000); // Wait for countdown to complete plus a small buffer
    return confirm('Did you see the numbers counting down from 10 to 0 with shifting colored backgrounds?');
  },
};
