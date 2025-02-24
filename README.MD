## Simple todo

### Highest priority

- [ ] Add badges (npm, license) to the README
- [ ] Fill in the readme
- [ ] In composition.off, don't require the type of event (requires reworking storing the listeners)

### Next priority

- [ ] Optional duration for a scene, could also extend to the longest clip + offset
- [ ] Add jsdoc comments to the code
  - [ ] Use https://www.webdoclabs.com/guides/index.html
- [ ] Add codesandbox example(s)
- [ ] Improve cursor rules
- [ ] Improve 1x video playback
  - [ ] by using the pixi.js VideoResource
  - [ ] Preload frames exactly on the fps of the composition
- [ ] FileStream for export, offer as download or something streaming, not an entire blob at once
- [ ] Add support for audio files
- [ ] Automatic centering around a center point, or top left
- [ ] Free (pixi) operations, such as rotate, alpha, scale, etc.
- [ ] Rename size to dimensions?
- [ ] Make scene duration optional; make it auto size to the longest clip?

### Low priority

- [ ] Fix the automatic playwright integration test recording
- [ ] Figure out how to automate with Playwright
- [ ] Support for HTML, embed a page or something in the video (perhaps via iframe?)
