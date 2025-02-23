import { WithId } from '../base/with-id';
import type { Size } from '../types';

export class VideoSource extends WithId {
  protected readonly width: number;
  protected readonly height: number;
  protected readonly duration: number;
  private videoElement: HTMLVideoElement;

  private constructor(
    width: number,
    height: number,
    duration: number,
    videoElement: HTMLVideoElement,
    private objectUrl: string | null
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

  public static async create(url: string | File | Blob): Promise<VideoSource> {
    // Create video element to get metadata
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous'; // Enable CORS for video loading

    const objectUrl = typeof url === 'string' ? null : URL.createObjectURL(url);
    const httpUrl = typeof url === 'string' ? url : null;

    // Create object URL for the blob
    video.src = objectUrl ?? httpUrl ?? ''; // '' should never happen

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

    const source = new VideoSource(video.videoWidth, video.videoHeight, video.duration, video, objectUrl);

    return source;
  }

  public getVideoElement(): HTMLVideoElement {
    return this.videoElement;
  }

  public destroy(): void {
    this.videoElement.pause();
    this.videoElement.remove();
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  public getSize(): Size {
    return {
      width: this.width,
      height: this.height,
    };
  }

  public getDuration(): number {
    return this.duration;
  }
}
