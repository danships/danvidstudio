import { Composition, ImageClip, ImageSource, VideoClip, VideoSource } from '../../..';
import type { ManualTestCase } from '../test-runner';

export const fileOrBlobTest: ManualTestCase = {
  key: 'file-or-blob',
  name: 'File or Blob',
  description: 'Tests loading an images as File and Blob, and video from blob',
  expectedBehavior: 'The image and video should be loaded and displayed correctly',
  setup: async (testContainer: HTMLDivElement): Promise<Composition> => {
    const composition = await Composition.create({ size: { width: 640, height: 480 }, backgroundColor: '#000000' });

    const imageResponse = await fetch('/backdrop.jpg');
    const imageBlob = await imageResponse.blob();
    const imageFile = new File([imageBlob], 'backdrop.jpg', { type: 'image/jpeg' });
    const imageSource = await ImageSource.create(imageFile);

    const clipperResponse = await fetch('/clipper.jpg');
    const clipperBlob = await clipperResponse.blob();
    const clipperSource = await ImageSource.create(clipperBlob);

    const videoResponse = await fetch('/countdown.webm');
    const videoBlob = await videoResponse.blob();
    const videoSource = await VideoSource.create(videoBlob);

    const watermark = await fetch('/logo.svg');
    const watermarkBlob = await watermark.blob();
    const watermarkObjectUrl = URL.createObjectURL(watermarkBlob);
    const watermarkSource = await ImageSource.create(watermarkObjectUrl);

    const scene = composition.createScene({ duration: 5 });
    scene.addClip(new ImageClip({ source: imageSource, duration: 5 }));
    scene.addClip(
      new VideoClip({
        source: videoSource,
        duration: 5,
        size: { width: 600, height: 335 },
        position: { left: 20, top: 70 },
      })
    );
    scene.addClip(
      new ImageClip({
        source: clipperSource,
        duration: 5,
        size: { width: 128, height: 128 },
        position: { top: 340, left: 500 },
      })
    );
    scene.addClip(
      new ImageClip({
        source: watermarkSource,
        duration: 5,
        size: { width: 128, height: 128 },
        position: { top: 340, left: 20 },
      })
    );

    composition.attachPlayer(testContainer);

    return composition;
  },
  run: async ({ confirm, sleep, composition }) => {
    composition?.play();

    await sleep(2000);

    return confirm(
      'Do you see the countdown video on a colored background, logo in the bottom left and the clipper image in the bottom right corner?'
    );
  },
};
