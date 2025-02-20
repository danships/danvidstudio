## Simple todo

- [ ] Simplify API, add the ability to add a clip directly to a composition, or a clip to a scene, etc.
- [ ] Merge start + end on a clip into a single property. Possible rename, it is not clear that that is on the track it self.
- [ ] Add a check that coverage is never allowed to drop below the value that it was at the last commit.
- [ ] Add jsdoc comments to the code
- [ ] Reorder scenes, tracks, clips, etc.
- [ ] Allow something like a backdrop to be added at the same level as a scene, so we don't need to add it to each scene.
- [ ] Add audio support
- [ ] Improve 1x video playback
  - [ ] by using the pixi.js VideoResource
  - [ ] Preload frames exactly on the fps of the composition
- [ ] FileStream for export, offer as download or something streaming, not an entire blob at once
- [ ] Add support for audio files
- [ ] Automatic centering around a center point, or top left
- [ ] Free (pixi) operations, such as rotate, alpha, scale, etc.

### Low priority

- [ ] Fix the automatic playwright integration test recording
