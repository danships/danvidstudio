import { Composition, ImageClip, ImageSource, VideoClip, VideoSource } from '../../..';
import type { ManualTestCase } from '../test-runner';

export const scaleDownVideoTest: ManualTestCase = {
  key: 'scale-down-video',
  name: 'Scale Down Video Test',
  description:
    'Tests scaling down a 640x480 video to fit a 320x320 canvas while maintaining aspect ratio and centering',
  expectedBehavior: 'You should see the countdown video scaled down and centered in a 320x320 canvas.',
  setup: async (testContainer: HTMLDivElement): Promise<Composition> => {
    const composition = await Composition.create({
      size: { width: 320, height: 320 },
      backgroundColor: '#000000',
    });

    const backdropSource = await ImageSource.create('/backdrop.jpg');
    const backdropClip = new ImageClip({
      id: 'backdrop',
      source: backdropSource,
      offset: 0,
      duration: 3,
    });
    composition.addClipToComposition(backdropClip);

    const videoSource = await VideoSource.create('/countdown.webm');

    // Calculate scaled dimensions maintaining aspect ratio
    const originalWidth = 640;
    const originalHeight = 480;
    const scale = Math.min(320 / originalWidth, 320 / originalHeight);
    const scaledWidth = originalWidth * scale;
    const scaledHeight = originalHeight * scale;

    // Calculate position to center the video
    const left = (320 - scaledWidth) / 2;
    const top = (320 - scaledHeight) / 2;

    const videoClip = new VideoClip({
      source: videoSource,
      offset: 0,
      duration: 3,
      size: { width: scaledWidth, height: scaledHeight },
      position: { left, top },
    });

    const scene = composition.createScene({ duration: 3 });
    const track = scene.addTrack({});
    track.addClip(videoClip);

    composition.attachPlayer(testContainer);
    composition.play();

    return composition;
  },
  run: async ({ confirm, sleep }) => {
    await sleep(3000); // Wait for video to complete plus a small buffer
    return confirm(
      'Did you see the countdown video properly scaled down and centered in the 320x320 canvas? The video should maintain its aspect ratio without stretching.'
    );
  },
};
