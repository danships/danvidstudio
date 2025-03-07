import { Composition, ImageClip, ImageSource, TextClip } from '../../..';
import type { ManualTestCase } from '../test-runner';

export const basicSceneTest: ManualTestCase = {
  key: 'basic-scene-rendering',
  name: 'Basic Scene Rendering',
  description: 'Tests the basic scene setup with a colored background',
  expectedBehavior:
    'You should see a composition with a gradient background. First a text is shown for 1.5 seconds, then centered is the clipper image.',
  setup: async (testContainer: HTMLDivElement): Promise<Composition> => {
    const composition = await Composition.create({ size: { width: 640, height: 480 }, backgroundColor: '#FF0000' });

    const backdropSource = await ImageSource.create('/backdrop.jpg');
    const backdropClip = new ImageClip({
      id: 'backdrop',
      source: backdropSource,
      offset: 0,
      duration: 3.5,
      position: { left: -200, top: -200 },
    });
    composition.addClipToComposition(backdropClip);

    const textClip = new TextClip({
      id: 'intro-text',
      style: {
        fontSize: 40,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#FFFFFF',
      },
      text: 'First danvidstudio test case',
      offset: 0,
      duration: 1.5,
      position: { left: 40, top: 200 },
    });
    const textScene = composition.createScene({ duration: 1.5 });
    const textTrack = textScene.createTrack({});
    textTrack.addClip(textClip);

    const clipper = await ImageSource.create('/clipper.jpg');
    const imageClip = new ImageClip({
      id: 'clipper',
      source: clipper,
      offset: 0,
      duration: 2,
      position: { left: 80, top: 10 },
      size: { width: 480, height: 460 },
    });
    const scene = composition.createScene({ duration: 2 });
    const track = scene.createTrack({});

    track.addClip(imageClip);

    composition.attachPlayer(testContainer);
    composition.play();

    return composition;
  },
  run: async ({ confirm, sleep }) => {
    await sleep(3500);
    return confirm('Did you see the gradient background with first the text and then the image?');
  },
};
