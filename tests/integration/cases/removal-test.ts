import type { Scene, Track } from '../../..';
import { Composition, VideoClip, VideoSource } from '../../..';
import type { ManualTestCase } from '../test-runner';

export const removalTest: ManualTestCase = {
  key: 'removal-test',
  name: 'Removal Test',
  description: 'Tests removal of clips, tracks and scenes',
  expectedBehavior:
    'You should see a video playing, then disappear when removed, then another video playing that also disappears, finally nothing should be visible.',
  setup: async (testContainer: HTMLDivElement): Promise<Composition> => {
    const composition = await Composition.create({ size: { width: 640, height: 480 }, backgroundColor: '#000000' });

    // Create first scene with a video
    const scene1 = composition.createScene({ duration: 10 });
    const track1 = scene1.addTrack({});
    const videoSource1 = await VideoSource.create(
      'https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4'
    );
    const videoClip1 = new VideoClip({
      source: videoSource1,
      offset: 0,
      duration: 5,
      size: { width: 640, height: 480 },
    });
    track1.addClip(videoClip1);

    // Create second scene with another video
    const scene2 = composition.createScene({ duration: 10 });
    const track2 = scene2.addTrack({});
    const videoSource2 = await VideoSource.create('/countdown.webm');
    const videoClip2 = new VideoClip({
      source: videoSource2,
      offset: 0,
      duration: 5,
      size: { width: 640, height: 480 },
    });
    track2.addClip(videoClip2);

    composition.attachPlayer(testContainer);
    composition.play();

    return composition;
  },
  run: async ({ confirm, sleep, composition }) => {
    if (!composition) {
      return false;
    }

    // Wait for first video to start playing
    await sleep(1000);

    // Remove first clip and verify
    if (!confirm('Did you see the first video (Big Buck Bunny) playing?')) {
      return false;
    }

    const scene1 = composition.getScenes()[0] as Scene;
    const track1 = scene1.getTracks()[0] as Track;
    const clip1 = track1.getClips()[0] as VideoClip;
    clip1.remove();

    await sleep(500);
    if (!confirm('Did the first video disappear?')) {
      return false;
    }

    // Remove second track and verify
    const scene2 = composition.getScenes()[1] as Scene;
    const track2 = scene2.getTracks()[0] as Track;
    track2.remove();

    await sleep(500);
    if (!confirm('Did you see no more videos playing?')) {
      return false;
    }

    // Remove first scene and verify
    scene1.remove();

    await sleep(500);
    if (!confirm('Is the composition completely empty now?')) {
      return false;
    }

    return true;
  },
};
