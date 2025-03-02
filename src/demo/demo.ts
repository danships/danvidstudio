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
  const track = scene.createTrack({});

  const imageClip = new ImageClip({
    source: clipperImage,
    offset: 0,
    duration: 10,
  });

  track.addClip(imageClip);
  return scene;
}

function createSplitImageScene(composition: Composition, clipperImage: ImageSource): Scene {
  const splitScene = composition.createScene({ duration: 1 });
  const splitTrack = splitScene.createTrack({});

  const firstClip = new ImageClip({
    id: 'top-left',
    source: clipperImage,
    offset: 0,
    duration: 2,
    position: { top: 0, left: 0 },
    size: { width: 320, height: 240 },
  });
  const secondClip = new ImageClip({
    id: 'bottom-right',
    source: clipperImage,
    offset: 0,
    duration: 2,
    position: { top: 240, left: 320 },
    size: { width: 320, height: 240 },
  });
  splitTrack.addClip(firstClip).addClip(secondClip);
  return splitScene;
}

function createAutoSizeAndCropScene(composition: Composition, gridImage: ImageSource): Scene {
  const autoSizeScene = composition.createScene({ duration: 1 });
  const autoSizeAndCropTrack = autoSizeScene.createTrack({});

  const autoSizeClip = new ImageClip({
    source: gridImage,
    offset: 0,
    duration: 1,
    size: { width: 640, height: 480 },
  });

  autoSizeAndCropTrack.addClip(autoSizeClip);

  const croppedClip = new ImageClip({
    source: gridImage,
    offset: 0,
    duration: 1,
    crop: { left: 512, top: 240, width: 640, height: 240 },
    position: { top: 100, left: 20 },
    size: { width: 320, height: 240 },
  });

  autoSizeAndCropTrack.addClip(croppedClip);
  return autoSizeScene;
}

function createPlainVideoScene(composition: Composition, video: VideoSource): Scene {
  const plainVideoScene = composition.createScene({ duration: 11 });
  const plainVideoTrack = plainVideoScene.createTrack({});

  const plainVideoClip = new VideoClip({
    source: video,
    offset: 0,
    duration: 10,
    size: { width: 640, height: 480 },
    // speed: 2,
    // range: { start: 7, end: 15 },
    crop: { left: 720, top: 720, width: 640, height: 480 },
  });

  plainVideoTrack.addClip(plainVideoClip);

  return plainVideoScene;
}

function createTextScene(composition: Composition): Scene {
  const textScene = composition.createScene({ duration: 5 });
  const textTrack = textScene.createTrack({});

  const titleClip = new TextClip({
    text: 'Hello, World!',
    offset: 0,
    duration: 5,
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
    offset: 1, // Delayed start
    duration: 4,
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

type SceneDefinition = {
  id: string;
  name: string;
  enabled: boolean;
  createFn: (composition: Composition, ..._arguments: any[]) => Scene;
  requiredSources?: string[];
};

// Scene definitions that can be toggled/reordered
const availableScenes: SceneDefinition[] = [
  {
    id: 'single-image',
    name: 'Single Image Scene',
    enabled: false,
    createFn: (composition: Composition, clipperImage: ImageSource) =>
      createSingleImageScene(composition, clipperImage),
    requiredSources: ['clipper.jpg'],
  },
  {
    id: 'split-image',
    name: 'Split Image Scene',
    enabled: true,
    createFn: (composition: Composition, clipperImage: ImageSource) => createSplitImageScene(composition, clipperImage),
    requiredSources: ['clipper.jpg'],
  },
  {
    id: 'auto-size-and-crop',
    name: 'Auto Size and Crop Scene',
    enabled: false,
    createFn: (composition: Composition, gridImage: ImageSource) => createAutoSizeAndCropScene(composition, gridImage),
    requiredSources: ['grid.jpg'],
  },
  {
    id: 'plain-video',
    name: 'Plain Video Scene',
    enabled: false,
    createFn: (composition: Composition, video: VideoSource) => createPlainVideoScene(composition, video),
    requiredSources: ['bunny.mp4'],
  },
  {
    id: 'text',
    name: 'Text Scene',
    enabled: true,
    createFn: (composition: Composition) => createTextScene(composition),
  },
];

// Load scene configuration from URL parameters
function loadSceneConfigFromUrl() {
  const params = new URLSearchParams(window.location.search);
  let enabledScenes = params.get('scenes')?.split(',') || [];

  // If no scenes are specified in URL, set default scenes
  if (enabledScenes.length === 0) {
    enabledScenes = ['split-image', 'text'];
  }

  // Reset all scenes to disabled
  availableScenes.forEach((scene) => {
    scene.enabled = false;
  });

  // Enable scenes in the order specified in URL or default order
  enabledScenes.forEach((sceneId) => {
    const scene = availableScenes.find((s) => s.id === sceneId);
    if (scene) {
      scene.enabled = true;
    }
  });

  // Reorder scenes based on URL order or default order
  const orderedScenes = [...availableScenes];
  orderedScenes.sort((a, b) => {
    const aIndex = enabledScenes.indexOf(a.id);
    const bIndex = enabledScenes.indexOf(b.id);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // Update availableScenes array in place
  availableScenes.splice(0, availableScenes.length, ...orderedScenes);
}

async function initDemo() {
  // Load scene configuration from URL
  loadSceneConfigFromUrl();

  // Create main container for side-by-side layout
  const mainContainer = document.createElement('div');
  mainContainer.style.display = 'flex';
  mainContainer.style.gap = '20px';
  mainContainer.style.maxWidth = '1200px';
  mainContainer.style.margin = '20px auto';
  mainContainer.style.alignItems = 'flex-start';
  document.body.append(mainContainer);

  // Create left side container for player and controls
  const playerContainer = document.createElement('div');
  playerContainer.style.flex = '1';
  mainContainer.append(playerContainer);

  // Create player div if it doesn't exist
  let playerDiv = document.querySelector('#player') as HTMLDivElement | null;
  if (!playerDiv) {
    playerDiv = document.createElement('div');
    playerDiv.id = 'player';
    playerDiv.style.width = '640px';
    playerDiv.style.height = '480px';
    playerDiv.style.backgroundColor = '#000';
    playerContainer.append(playerDiv);
  }

  // Initialize composition
  let composition = await Composition.create({ logLevel: LogLevel.DEBUG, size: { width: 640, height: 480 } });

  // Load sources
  const sources: Record<string, ImageSource | VideoSource> = {
    'clipper.jpg': await ImageSource.create('/clipper.jpg'),
    'grid.jpg': await ImageSource.create('/grid.jpg'),
    'bunny.mp4': await VideoSource.create(
      'https://diffusion-studio-public.s3.eu-central-1.amazonaws.com/videos/big_buck_bunny_1080p_30fps.mp4'
    ),
  };

  // Create right side container for scene manager
  const rightContainer = document.createElement('div');
  rightContainer.style.flex = '1';
  rightContainer.style.maxWidth = '400px';
  mainContainer.append(rightContainer);

  // Create scene manager (now appending to rightContainer instead of document.body)
  function createSceneManager(sources: Record<string, ImageSource | VideoSource>) {
    // Create scene manager container
    const managerContainer = document.createElement('div');
    managerContainer.style.padding = '20px';
    managerContainer.style.backgroundColor = '#f5f5f5';
    managerContainer.style.borderRadius = '8px';

    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Scene Manager';
    title.style.marginBottom = '15px';
    managerContainer.append(title);

    // Create scene list
    const sceneList = document.createElement('div');
    sceneList.style.marginBottom = '20px';

    // Create scenes
    availableScenes.forEach((scene, index) => {
      const sceneItem = document.createElement('div');
      sceneItem.className = 'scene-item';
      sceneItem.style.display = 'flex';
      sceneItem.style.alignItems = 'center';
      sceneItem.style.padding = '10px';
      sceneItem.style.backgroundColor = 'white';
      sceneItem.style.marginBottom = '5px';
      sceneItem.style.borderRadius = '4px';

      // Enable/disable checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = scene.enabled;
      checkbox.style.marginRight = '10px';
      checkbox.addEventListener('change', () => {
        scene.enabled = checkbox.checked;
      });

      // Scene name
      const nameSpan = document.createElement('span');
      nameSpan.textContent = scene.name;
      nameSpan.style.flex = '1';

      // Move up button
      const upButton = document.createElement('button');
      upButton.textContent = '↑';
      upButton.style.marginRight = '5px';
      upButton.disabled = index === 0;
      upButton.addEventListener('click', () => {
        if (index > 0) {
          // Get the scenes we want to swap
          const currentScene = availableScenes[index];
          const previousScene = availableScenes[index - 1];

          // Only swap if both scenes exist
          if (currentScene && previousScene) {
            availableScenes[index] = previousScene;
            availableScenes[index - 1] = currentScene;
            refreshSceneManager();
          }
        }
      });

      // Move down button
      const downButton = document.createElement('button');
      downButton.textContent = '↓';
      downButton.disabled = index === availableScenes.length - 1;
      downButton.addEventListener('click', () => {
        if (index < availableScenes.length - 1) {
          // Get the scenes we want to swap
          const currentScene = availableScenes[index];
          const nextScene = availableScenes[index + 1];

          // Only swap if both scenes exist
          if (currentScene && nextScene) {
            availableScenes[index] = nextScene;
            availableScenes[index + 1] = currentScene;
            refreshSceneManager();
          }
        }
      });

      sceneItem.append(checkbox, nameSpan, upButton, downButton);
      sceneList.append(sceneItem);
    });

    // Create apply button
    const applyButton = document.createElement('button');
    applyButton.textContent = 'Apply Changes';
    applyButton.style.padding = '10px 20px';
    applyButton.style.backgroundColor = '#4CAF50';
    applyButton.style.color = 'white';
    applyButton.style.border = 'none';
    applyButton.style.borderRadius = '4px';
    applyButton.style.cursor = 'pointer';
    applyButton.addEventListener('click', () => {
      // Get enabled scenes in current order
      const enabledScenes = availableScenes.filter((scene) => scene.enabled).map((scene) => scene.id);

      // Create URL with new scene configuration
      const params = new URLSearchParams();
      params.set('scenes', enabledScenes.join(','));

      // Refresh page with new URL
      window.location.search = params.toString();
    });

    managerContainer.append(sceneList, applyButton);
    rightContainer.append(managerContainer);

    function refreshSceneManager() {
      managerContainer.remove();
      createSceneManager(sources);
    }
  }

  // Create scene manager
  createSceneManager(sources);

  // Create initial scenes
  composition = await refreshComposition(sources);

  // Create progress container
  const progressContainer = document.createElement('div');
  progressContainer.style.width = '640px';
  progressContainer.style.margin = '10px 0';
  progressContainer.style.display = 'flex';
  progressContainer.style.flexDirection = 'column';
  progressContainer.style.gap = '10px';

  // Create progress bar
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.style.width = '100%';

  const progressFill = document.createElement('div');
  progressFill.className = 'progress-fill';
  progressFill.style.width = '0%';
  progressBar.append(progressFill);

  // Create time display
  const timeDisplay = document.createElement('div');
  timeDisplay.className = 'time-display';
  timeDisplay.textContent = '00:00 / 00:00';

  progressContainer.append(progressBar);
  progressContainer.append(timeDisplay);
  playerContainer.append(progressContainer);

  // Create controls
  const controls = document.createElement('div');
  controls.className = 'controls-container';
  controls.style.textAlign = 'center';
  controls.style.margin = '20px 0';

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
  playerContainer.append(controls);

  // Create status text
  const status = document.createElement('div');
  status.className = 'status-text';
  status.style.textAlign = 'center';
  status.style.margin = '20px 0';
  playerContainer.append(status);

  // Subscribe to time updates
  composition.on('time', (currentTime, totalDuration) => {
    const progress = (currentTime / totalDuration) * 100;
    progressFill.style.width = `${progress}%`;
    timeDisplay.textContent = `${Math.floor(currentTime)}s / ${Math.floor(totalDuration)}s`;
  });

  // Auto-play the composition
  try {
    console.log('Before play:', { scenes: composition['scenes'] }); // Debug log
    composition.play();
    status.textContent = 'Playing...';
  } catch (error: unknown) {
    console.error('Play error:', error); // Debug log
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    status.textContent = `Failed to auto-play: ${errorMessage}`;
  }

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
    composition.seek(Math.random() * composition.getDuration());
  });
}

async function refreshComposition(sources: Record<string, ImageSource | VideoSource>) {
  // Clear existing scenes by recreating the composition
  console.log('Creating new composition');
  const newComposition = await Composition.create({ logLevel: LogLevel.DEBUG, size: { width: 640, height: 480 } });

  // Wait for composition to be ready before using it
  console.log('Waiting for new composition to be ready');
  await newComposition.waitForReady();

  // Create enabled scenes in the specified order
  console.log('Creating enabled scenes');
  for (const scene of availableScenes) {
    if (scene.enabled) {
      console.log('Creating scene:', scene.name);
      if (scene.requiredSources) {
        const requiredSources = scene.requiredSources.map((source) => sources[source]);
        scene.createFn(newComposition, ...requiredSources);
      } else {
        scene.createFn(newComposition);
      }
    }
  }

  // Attach to player
  const playerDiv = document.querySelector('#player');
  if (playerDiv) {
    console.log('Attaching player');
    newComposition.attachPlayer(playerDiv as HTMLDivElement);
    console.log('Player attached');

    // Seek to start to ensure first scene is visible
    newComposition.seek(0);
  }

  // Return the new composition
  return newComposition;
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
