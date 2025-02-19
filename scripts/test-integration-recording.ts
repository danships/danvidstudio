import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

/**
 * TODO this needs some work to make it work, playwright starts but then nothing happens,
 * it does not seem to be running the tests.
 */

async function waitForProcess(process: ReturnType<typeof spawn>): Promise<number> {
  return new Promise((resolve, reject) => {
    process.on('close', resolve);
    process.on('error', reject);
  });
}

async function main() {
  // First build the package
  console.log('Building package...');
  const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
  await waitForProcess(buildProcess);

  // Start the test environment
  console.log('Starting test environment...');
  const testProcess = spawn('npm', ['run', 'test:integration:automatic', '--no-open'], { stdio: 'inherit' });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Launch browser and start recording
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: './test-recordings',
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  // Setup console message listener before navigating
  let testCompleted = false;
  page.on('console', (message) => {
    const text = message.text();
    console.log(`Browser console: ${text}`);
    if (text === 'All tests are done!') {
      testCompleted = true;
    }
  });

  try {
    await page.goto('http://localhost:5173/tests/integration/index.html');

    // Wait for the completion message or timeout after 5 minutes
    await Promise.race([
      new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (testCompleted) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 1000);
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for tests')), 300_000)),
    ]);

    console.log('Tests completed, closing browser...');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await context.close();
    await browser.close();
    testProcess.kill();
    process.exit(0);
  }
}

main().catch(console.error);
