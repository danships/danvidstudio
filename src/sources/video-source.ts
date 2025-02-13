import { WithId } from '../base/with-id';

export class VideoSource extends WithId {
  public readonly width: number;
  public readonly height: number;
  public readonly duration: number;
  private videoElement: HTMLVideoElement;

  private constructor(
    public readonly url: string,
    width: number,
    height: number,
    duration: number,
    videoElement: HTMLVideoElement
  ) {
    super();
    this.width = width;
    this.height = height;
    this.duration = duration;
    this.videoElement = videoElement;

    // Set video properties for smooth playback
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    this.videoElement.loop = false;
    this.videoElement.preload = 'auto';
  }

  public static async create(url: string): Promise<VideoSource> {
    // Create video element to get metadata
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous'; // Enable CORS for video loading

    // Create object URL for the blob
    video.src = url;

    // Wait for metadata and first frame to load
    await new Promise<void>((resolve, reject) => {
      const handleError = () => reject(new Error('Failed to load video'));

      video.addEventListener('error', handleError);

      video.addEventListener(
        'loadedmetadata',
        () => {
          // After metadata, wait for data to be loaded
          video.addEventListener(
            'loadeddata',
            () => {
              // Seek to first frame and wait for it to be ready
              video.currentTime = 0;
              video.addEventListener('seeked', () => resolve(), { once: true });
            },
            { once: true }
          );
        },
        { once: true }
      );
    });

    const source = new VideoSource(url, video.videoWidth, video.videoHeight, video.duration, video);

    return source;
  }

  public getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  public destroy(): void {
    this.videoElement.pause();
    if (this.videoElement.src) {
      URL.revokeObjectURL(this.videoElement.src);
    }
    this.videoElement.remove();
  }
}
