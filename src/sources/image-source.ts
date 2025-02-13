export class ImageSource {
  constructor(
    public blob: Blob,
    public width: number,
    public height: number
  ) {}

  public static async create(url: string): Promise<ImageSource> {
    const imageElement = document.createElement('img');
    imageElement.src = url;

    return new Promise((resolve, reject) => {
      imageElement.addEventListener('load', () => {
        // Create canvas to convert image to blob
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image to canvas
        context.drawImage(imageElement, 0, 0);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image to blob'));
            return;
          }

          const imageSource = new ImageSource(blob, imageElement.width, imageElement.height);
          resolve(imageSource);
        }, 'image/png');
      });
      imageElement.addEventListener('error', () => {
        reject(new Error('Failed to load image'));
      });
    });
  }
}
