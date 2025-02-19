declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_APP_AUTOMATIC?: string;
    };
  }
}

import { basicSceneTest } from './cases/basic-scene-test';
import { countdownTest } from './cases/countdown-test';
import { simpleVideoTest } from './cases/simple-video-test';
import { speedUpTest } from './cases/speed-up-test';
import { ManualTestRunner } from './test-runner';

export async function runManualTests() {
  const runner = new ManualTestRunner('test-container');

  runner.addTest(basicSceneTest);
  runner.addTest(simpleVideoTest);
  runner.addTest(countdownTest);
  runner.addTest(speedUpTest);

  // read testId from the query search params
  const url = new URL(globalThis.location.href);
  const testKey = url.searchParams.get('key') ?? basicSceneTest.key;
  const runAutomatic = import.meta.env.VITE_APP_AUTOMATIC === 'true';
  const stopOnCompletion = url.searchParams.get('stop') === 'true';
  await runner.start(testKey, runAutomatic, stopOnCompletion);
}
