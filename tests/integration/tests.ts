import { basicSceneTest } from './cases/basic-scene-test';
import { simpleVideoTest } from './cases/simple-video-test';
import { ManualTestRunner } from './test-runner';

export async function runManualTests() {
  const runner = new ManualTestRunner('test-container');

  runner.addTest(basicSceneTest);
  runner.addTest(simpleVideoTest);

  // read testId from the query search params
  const url = new URL(globalThis.location.href);
  const testKey = url.searchParams.get('key') ?? basicSceneTest.key;
  const runAutomatic = url.searchParams.get('automatic') === 'true';
  await runner.start(testKey, runAutomatic);
}
