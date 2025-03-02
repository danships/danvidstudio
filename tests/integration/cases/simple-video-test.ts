import { Composition, VideoClip, VideoSource } from '../../..';
import type { ManualTestCase } from '../test-runner';

export const simpleVideoTest: ManualTestCase = {
  key: 'simple-video-rendering',
  name: 'Simple Video Rendering',
  description: 'Tests basic video playback functionality',
  expectedBehavior: 'You should see a video playing in the center of the composition for 5 seconds.',
  setup: async (testContainer: HTMLDivElement): Promise<Composition> => {
    const composition = await Composition.create({ size: { width: 640, height: 480 }, backgroundColor: '#000000' });

    const videoSource = await VideoSource.create(
      'https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4'
    );
    const videoClip = new VideoClip({
      source: videoSource,
      offset: 0,
      duration: 5,
      size: { width: 640, height: 480 },
    });

    const scene = composition.createScene({ duration: 5 });
    const track = scene.createTrack({});
    track.addClip(videoClip);

    composition.attachPlayer(testContainer);
    composition.play();

    return composition;
  },
  run: async ({ confirm, sleep }) => {
    await sleep(5500); // Wait for video to complete plus a small buffer
    return confirm(
      'Did you see the video play for 5 seconds in the center of the composition? It shows Big Buck Bunny and a butterfly flying past its nose.'
    );
  },
};
