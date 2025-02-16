/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-console */
import { ImageClip } from '../clips/image-clip';
import { TextClip } from '../clips/text-clip';
import { VideoClip } from '../clips/video-clip';
import type { Scene } from '../composition/scene';
import { Composition } from '../index';
import { ImageSource } from '../sources/image-source';
import { VideoSource } from '../sources/video-source';
import { LogLevel } from '../utils/logger';

function createSingleImageScene(composition: Composition, clipperImage: ImageSource): Scene {
  const scene = composition.createScene({ duration: 2 });
  const track = scene.addTrack({});

  const imageClip = new ImageClip({
    source: clipperImage,
    start: 0,
    end: 10,
  });

  track.addClip(imageClip);
  return scene;
}

function createSplitImageScene(composition: Composition, clipperImage: ImageSource): Scene {
  const splitScene = composition.createScene({ duration: 1 });
  const splitTrack = splitScene.addTrack({});

  const firstClip = new ImageClip({
    source: clipperImage,
    start: 0,
    end: 2,
    position: { top: 0, left: 0 },
    size: { width: 320, height: 240 },
  });
  const secondClip = new ImageClip({
    source: clipperImage,
    start: 0,
    end: 2,
    position: { top: 240, left: 320 },
    size: { width: 320, height: 240 },
  });
  splitTrack.addClip(firstClip);
  splitTrack.addClip(secondClip);
  return splitScene;
}

function createAutoSizeAndCropScene(composition: Composition, gridImage: ImageSource): Scene {
  const autoSizeScene = composition.createScene({ duration: 1 });
  const autoSizeAndCropTrack = autoSizeScene.addTrack({});

  const autoSizeClip = new ImageClip({
    source: gridImage,
    start: 0,
    end: 1,
    size: { width: 640, height: 480 },
  });

  autoSizeAndCropTrack.addClip(autoSizeClip);

  const croppedClip = new ImageClip({
    source: gridImage,
    start: 0,
    end: 1,
    crop: { x: 512, y: 240, width: 640, height: 240 },
    position: { top: 100, left: 20 },
    size: { width: 320, height: 240 },
  });

  autoSizeAndCropTrack.addClip(croppedClip);
  return autoSizeScene;
}

function createPlainVideoScene(composition: Composition, video: VideoSource): Scene {
  const plainVideoScene = composition.createScene({ duration: 11 });
  const plainVideoTrack = plainVideoScene.addTrack({});

  const plainVideoClip = new VideoClip({
    source: video,
    start: 0,
    end: 10,
    size: { width: 640, height: 480 },
    // speed: 2,
    // range: { start: 7, end: 15 },
    crop: { x: 720, y: 720, width: 640, height: 480 },
  });

  plainVideoTrack.addClip(plainVideoClip);

  return plainVideoScene;
}

function createTextScene(composition: Composition): Scene {
  const textScene = composition.createScene({ duration: 5 });
  const textTrack = textScene.addTrack({});

  const titleClip = new TextClip({
    text: 'Hello, World!',
    start: 0,
    end: 5,
    style: {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: 0xff_ff_ff,
      fontWeight: 'bold',
      align: 'center',
    },
    position: { top: 200, left: 320 }, // Center of screen (640/2)
    size: { width: 640, height: 48 }, // Full width to allow center alignment to work
  });

  const subtitleClip = new TextClip({
    id: 'created-with',
    text: 'Created with danvidstudio',
    start: 1, // Delayed start
    end: 5,
    style: {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0x00_ff_00,
      fontStyle: 'italic',
      align: 'center',
    },
    position: { top: 260, left: 175 }, // Center of screen (640/2)
    size: { width: 640, height: 24 }, // Full width to allow center alignment to work
  });

  textTrack.addClip(titleClip);
  textTrack.addClip(subtitleClip);
  return textScene;
}

async function initDemo() {
  // Create progress container
  const progressContainer = document.createElement('div');
  progressContainer.style.width = '640';
  progressContainer.style.margin = '10px auto';
  progressContainer.style.display = 'flex';
  progressContainer.style.flexDirection = 'column';
  progressContainer.style.gap = '10px';

  // Create progress bar
  const progressBar = document.createElement('div');
  progressBar.style.width = '100%';
  progressBar.style.height = '20px';
  progressBar.style.backgroundColor = '#ddd';
  progressBar.style.borderRadius = '10px';
  progressBar.style.overflow = 'hidden';

  const progressFill = document.createElement('div');
  progressFill.style.width = '0%';
  progressFill.style.height = '100%';
  progressFill.style.backgroundColor = '#4CAF50';
  progressFill.style.transition = 'width 0.1s linear';
  progressBar.append(progressFill);

  // Create time display
  const timeDisplay = document.createElement('div');
  timeDisplay.style.fontFamily = 'monospace';
  timeDisplay.style.textAlign = 'center';
  timeDisplay.textContent = '00:00 / 00:00';

  progressContainer.append(progressBar);
  progressContainer.append(timeDisplay);
  document.body.append(progressContainer);

  // Create controls
  const controls = document.createElement('div');
  controls.style.textAlign = 'center';
  controls.style.margin = '20px';

  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset';
  resetButton.style.margin = '0 10px';

  const playButton = document.createElement('button');
  playButton.textContent = 'Play';
  playButton.style.margin = '0 10px';

  const pauseButton = document.createElement('button');
  pauseButton.textContent = 'Pause';
  pauseButton.style.margin = '0 10px';

  const exportButton = document.createElement('button');
  exportButton.textContent = 'Export Video';
  exportButton.style.margin = '0 10px';

  const randomSeekButton = document.createElement('button');
  randomSeekButton.textContent = 'Random Seek';
  randomSeekButton.style.margin = '0 10px';

  controls.append(resetButton);
  controls.append(playButton);
  controls.append(pauseButton);
  controls.append(exportButton);
  controls.append(randomSeekButton);
  document.body.append(controls);

  // Create status text
  const status = document.createElement('div');
  status.style.textAlign = 'center';
  status.style.margin = '20px';
  document.body.append(status);

  // Initialize composition
  const composition = new Composition({ logLevel: LogLevel.DEBUG, size: { width: 640, height: 480 } });
  await composition.ready;

  // Load the image source
  const clipperImage = await ImageSource.create('/clipper.jpg');
  const gridImage = await ImageSource.create('/grid.jpg');
  const bunnySource = await VideoSource.create(
    'https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4'
  );

  // Subscribe to time updates
  composition.onTimeUpdate((currentTime, totalDuration) => {
    const progress = (currentTime / totalDuration) * 100;
    progressFill.style.width = `${progress}%`;
    timeDisplay.textContent = `${Math.floor(currentTime)}s / ${Math.floor(totalDuration)}s`;
  });

  // Create scenes
  //await createSingleImageScene(composition, clipperImage);
  createSplitImageScene(composition, clipperImage);
  //createAutoSizeAndCropScene(composition, gridImage);
  //createPlainVideoScene(composition, bunnySource);
  createTextScene(composition);

  // Preview the composition
  const playerDiv = document.querySelector('#player');
  if (playerDiv) {
    composition.attachPlayer(playerDiv as HTMLDivElement);
  }
  // disable auto play
  // composition.play();

  // Add event listeners
  resetButton.addEventListener('click', () => {
    composition.seek(0);
  });

  playButton.addEventListener('click', () => {
    try {
      composition.play();
      status.textContent = 'Playing...';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      status.textContent = `Failed to play: ${errorMessage}`;
    }
  });

  pauseButton.addEventListener('click', () => {
    try {
      composition.pause();
      status.textContent = 'Paused';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      status.textContent = `Failed to pause: ${errorMessage}`;
    }
  });

  exportButton.addEventListener('click', async () => {
    try {
      status.textContent = 'Exporting...';
      exportButton.disabled = true;

      const blob = await composition.export(
        {
          format: 'mp4',
          codec: 'vp8',
          bitrate: 5_000_000, // 5 Mbps
        },
        (progress) => {
          status.textContent = `Exporting: ${Math.round(progress.percentage)}%`;
        }
      );

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'video.webm';
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      status.textContent = 'Export complete!';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      status.textContent = `Export failed: ${errorMessage}`;
      throw error;
    } finally {
      exportButton.disabled = false;
    }
  });

  randomSeekButton.addEventListener('click', () => {
    composition.seek(Math.random() * composition.duration);
  });
}

// Initialize the demo
initDemo().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error('Failed to initialize demo:', errorMessage);

  // Show error on page
  const errorDiv = document.createElement('div');
  errorDiv.style.color = 'red';
  errorDiv.style.textAlign = 'center';
  errorDiv.style.margin = '20px';
  errorDiv.textContent = `Failed to initialize demo: ${errorMessage}`;
  document.body.append(errorDiv);

  throw error;
});
