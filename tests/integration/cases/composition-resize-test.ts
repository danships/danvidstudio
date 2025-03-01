import { Composition, TextClip } from '../../..';
import type { ManualTestCase } from '../test-runner';

export const compositionResizeTest: ManualTestCase = {
  key: 'composition-resize',
  name: 'Composition Resize',
  description: 'Tests the composition resize functionality',
  expectedBehavior:
    'You should see a composition that starts at 320x240 and after 1 second resizes smoothly to 640x480',
  setup: async (testContainer: HTMLDivElement): Promise<Composition> => {
    // Create a composition with initial size
    const composition = await Composition.create({
      size: { width: 320, height: 240 },
      fps: 30,
      backgroundColor: '#FF0000',
    });

    composition.on('size', (width: number, height: number) => {
      console.log(`Size updated to: ${width}x${height}`);
    });

    // Create a text clip to show the current size
    const textClip = new TextClip({
      id: 'size-text',
      style: {
        fontSize: 20,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: '#FFFFFF',
      },
      text: '320x240',
      offset: 0,
      duration: 3,
      position: { left: 10, top: 10 },
    });

    const scene = composition.createScene({ duration: 3 });
    const track = scene.addTrack({});
    track.addClip(textClip);

    // Attach the player to the container
    composition.attachPlayer(testContainer);
    composition.play();

    // Schedule the resize after 1 second
    setTimeout(() => {
      composition.setSize(640, 480);
      textClip.setText('640x480');
    }, 1000);

    return composition;
  },
  run: async ({ confirm, sleep }) => {
    await sleep(2000); // Wait for the resize to complete
    return confirm('Did you see the composition resize from 320x240 to 640x480 with the size displayed in text?');
  },
};
