import { basicSceneTest } from './cases/basic-scene-test';
import { ManualTestRunner } from './test-runner';

export async function runManualTests() {
  const runner = new ManualTestRunner('test-container');

  runner.addTest(basicSceneTest);

  // read testId from the query search params
  const url = new URL(globalThis.location.href);
  const testKey = url.searchParams.get('key') ?? basicSceneTest.key;
  await runner.start(testKey);
}
