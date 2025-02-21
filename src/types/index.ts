export type Position = {
  top: number;
  left: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Crop = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export enum ClipType {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text',
}
