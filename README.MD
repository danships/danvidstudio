## Simple todo

### Highest priority

- [ ] Add jsdoc comments to the code
  - [ ] Use https://www.webdoclabs.com/guides/index.html
- [ ] Remove scenes, tracks, clips, etc.
- [ ] Add a type to each clip, so we can recognize what type of clip it is (Clip => BaseClip, Clip = ImageClip | VideoClip | TextClip | etc.)

### Next priority

- [ ] Improve 1x video playback
  - [ ] by using the pixi.js VideoResource
  - [ ] Preload frames exactly on the fps of the composition
- [ ] FileStream for export, offer as download or something streaming, not an entire blob at once
- [ ] Add support for audio files
- [ ] Automatic centering around a center point, or top left
- [ ] Free (pixi) operations, such as rotate, alpha, scale, etc.

### Low priority

- [ ] Fix the automatic playwright integration test recording
- [ ] Figure out how to automate with Playwright
