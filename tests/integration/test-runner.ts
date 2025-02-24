/* eslint-disable @typescript-eslint/no-misused-promises */
import { debug } from '../..';
import type { Composition } from '../..';

type RunParameters = {
  composition?: Composition;
  confirm: (text: string) => boolean;
  sleep: (duration: number) => Promise<void>;
};

export interface ManualTestCase {
  key: string;
  name: string;
  description: string;
  expectedBehavior: string;
  run?: (parameters: RunParameters) => Promise<boolean> | boolean;
  setup: (
    testContainer: HTMLDivElement,
    controlsContainer: HTMLDivElement
  ) => Promise<Composition | void> | Composition;
  setupControls?: (controlsContainer: HTMLDivElement) => Promise<void> | void;
}

export class ManualTestRunner {
  private currentTestIndex = 0;
  private testCases: ManualTestCase[] = [];
  private container: HTMLElement;
  private timelineContainer: HTMLElement;
  private testCaseRunning: ManualTestCase | null = null;
  private composition: Composition | null = null;
  private runAutomatic = false;
  private testConfirmationResult: boolean | null = null;
  private alertedOnVerifyTest = false;
  private manuallySelected = false;
  private stopOnCompletion = false;

  constructor(containerId: string) {
    this.container = document.querySelector(`#${containerId}`) || document.body;
    this.timelineContainer = document.querySelector('#timeline-container') || document.body;
    this.setupTabs();
  }

  private setupTestSelector() {
    const testSelector = document.querySelector('#test-selector') as HTMLDivElement;
    const testSelect = document.querySelector('#test-case-select') as HTMLSelectElement;

    if (!this.runAutomatic && testSelector && testSelect) {
      // Clear existing options except the first one
      while (testSelect.options.length > 1) {
        testSelect.remove(1);
      }
      for (const test of this.testCases) {
        const option = document.createElement('option');
        option.value = test.key;
        option.textContent = `${test.name}`;
        testSelect.append(option);
      }
      // Set the current test as selected
      testSelect.value = this.testCaseRunning?.key || '';
    }
  }

  public jumpToTest(testKey: string) {
    if (!testKey) {
      return;
    }
    this.manuallySelected = true;
    globalThis.location.href = `?key=${testKey}&stop=true`;
  }

  private setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    for (const button of tabButtons) {
      button.addEventListener('click', () => {
        const tabId = (button as HTMLElement).dataset['tab'];

        // Update active states
        for (const button_ of tabButtons) {
          button_.classList.remove('active');
        }
        for (const content of tabContents) {
          content.classList.remove('active');
        }

        button.classList.add('active');
        document.querySelector(`#${tabId}-tab`)?.classList.add('active');
      });
    }
  }

  public addTest(testCase: ManualTestCase) {
    this.testCases.push(testCase);
  }

  public async start(testKey: string, runAutomatic: boolean, stopOnCompletion: boolean) {
    if (this.testCases.length === 0) {
      console.warn('No test cases added');
      return;
    }

    this.runAutomatic = runAutomatic;
    this.stopOnCompletion = stopOnCompletion;
    const testVerificationControls = document.querySelector(
      '#test-verification-controls'
    ) as unknown as HTMLDivElement | null;
    if (this.runAutomatic && testVerificationControls) {
      testVerificationControls.style.display = 'none';
    }

    const testIndex = this.testCases.findIndex((testToCheck) => testToCheck.key === testKey);
    if (testIndex === -1) {
      console.warn(`Test with key ${testKey} not found`);
      return;
    }

    const testCaseRunning = this.testCases[testIndex];
    if (!testCaseRunning) {
      throw new Error(`Test with key ${testKey} not found`);
    }
    this.testCaseRunning = testCaseRunning;
    this.currentTestIndex = testIndex;
    await this.runTest(testCaseRunning);

    if (this.testConfirmationResult) {
      this.verifyTest(true);
    }
  }

  private confirm(text: string): boolean {
    if (this.runAutomatic) {
      return true;
    }

    const result = globalThis.confirm(text);
    this.testConfirmationResult = this.testConfirmationResult === null ? result : result && this.testConfirmationResult;
    return result;
  }

  private async runTest(test: ManualTestCase) {
    const container = document.querySelector('#test-container');
    const controlsContainer = document.querySelector('#test-controls-container');
    if (!container || !controlsContainer) {
      throw new Error('Test container or controls container not found');
    }

    this.displayTestInfo(test);
    this.setupTestSelector();

    try {
      const composition = await test.setup(container as HTMLDivElement, controlsContainer as HTMLDivElement);
      this.composition = composition || null;

      // Handle controls section
      if (controlsContainer.children.length > 0) {
        (controlsContainer as HTMLDivElement).style.display = 'block';
      } else {
        (controlsContainer as HTMLDivElement).style.display = 'none';
      }

      // Create timeline if composition is returned
      if (composition) {
        debug.renderDebug(composition, this.timelineContainer);

        if (!this.runAutomatic) {
          // Add playback controls
          const playbackControls = document.createElement('div');
          playbackControls.className = 'playback-controls';

          const pauseButton = document.createElement('button');
          pauseButton.textContent = 'Pause';
          pauseButton.addEventListener('click', () => composition.pause());

          const resumeButton = document.createElement('button');
          resumeButton.textContent = 'Resume';
          resumeButton.addEventListener('click', () => composition.play());

          const resetButton = document.createElement('button');
          resetButton.textContent = 'Reset';
          resetButton.addEventListener('click', () => {
            composition.pause();
            composition.seek(0);
          });

          const exportButton = document.createElement('button');
          exportButton.textContent = 'Export';
          exportButton.addEventListener('click', async () => {
            const blob = await composition.export({
              format: 'webm',
            });

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'video.webm';
            document.body.append(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          });

          playbackControls.append(pauseButton, resumeButton, resetButton, exportButton);
          controlsContainer.insertBefore(playbackControls, controlsContainer.firstChild);
        }

        const progress = document.createElement('div');
        progress.innerHTML = 'Playback progress: 0%';
        controlsContainer.append(progress);

        const formatTime = (time: number) => {
          const minutes = Math.floor(time / 60);
          const seconds = Math.floor(time % 60);
          const ms = Math.floor((time % 1) * 1000);
          return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
        };

        composition.on('time', (currentTime, totalDuration) => {
          progress.innerHTML = `Progress: ${((currentTime / totalDuration) * 100).toFixed(2)}% (${formatTime(currentTime)} / ${formatTime(totalDuration)})`;
        });

        const testControlsContainer = document.querySelector('#test-controls-container');
        if (testControlsContainer) {
          (testControlsContainer as HTMLDivElement).style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Error preparing test', error);
      if (!this.runAutomatic) {
        alert('Error running test, please check the console for more information');
      }
      this.verifyTest(false);
      return;
    }

    if (test.run) {
      try {
        const runParameters: RunParameters = {
          confirm: (text: string) => this.confirm(text),
          sleep: (duration: number) => new Promise((resolve) => setTimeout(resolve, duration)),
        };
        if (this.composition) {
          runParameters.composition = this.composition;
        }
        await test.run(runParameters);
      } catch (error) {
        console.error('Error running test', error);
        if (!this.runAutomatic) {
          alert('Error running test, please check the console for more information');
        }
        this.verifyTest(false);
        return;
      }
    } else if (this.runAutomatic && this.composition) {
      const duration = this.composition.getDuration();
      // Waiting video duration to complete
      await new Promise((resolve) => setTimeout(resolve, duration * 1000));
    }

    if (this.runAutomatic) {
      this.verifyTest(true);
    }
    if (this.testConfirmationResult !== null) {
      this.verifyTest(this.testConfirmationResult);
    }
  }

  private displayTestInfo(test: ManualTestCase) {
    this.container.innerHTML = `
      <div id="test-selector" class="test-selector" style="display: ${this.runAutomatic ? 'none' : 'block'}">
        <select id="test-case-select" onchange="window.__testRunner?.jumpToTest(this.value)">
          <option value="">Select a test case...</option>
        </select>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div class="test-info">
          <h2>Test ${this.currentTestIndex + 1}/${this.testCases.length}: ${test.name}</h2>
          <p><strong>Description:</strong> ${test.description}</p>
          <p><strong>Expected Behavior:</strong> ${test.expectedBehavior}</p>
        </div>
        <div id="test-verification-controls" style="margin-left: 20px;">
          <button onclick="window.__testRunner.verifyTest(true)">Pass</button>
          <button onclick="window.__testRunner.verifyTest(false)">Fail</button>
        </div>
      </div>
      <div id="test-content" style="display: flex; justify-content: center; align-items: center;"></div>
    `;

    // Make the test runner accessible globally for the buttons
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__testRunner = this;
  }

  public verifyTest(passed: boolean) {
    if (this.alertedOnVerifyTest || this.stopOnCompletion) {
      return;
    }

    this.alertedOnVerifyTest = true;

    if (this.runAutomatic) {
      console.log('Automatic run of test completed.');
    } else {
      console.log('Test', this.testCaseRunning?.name, passed ? 'passed' : 'failed');
    }

    // Don't continue to next test if this one was manually selected
    if (this.manuallySelected) {
      return;
    }

    const nextTest = this.testCases[this.currentTestIndex + 1] ?? '';
    if (nextTest) {
      console.log('Opening next test', nextTest.key);
      globalThis.location.href = `?key=${nextTest.key}`;
      return;
    }

    if (this.runAutomatic) {
      console.log('All tests are done!');
      return;
    }
    alert('All tests are done!');
  }
}
