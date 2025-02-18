import { PixiTree } from './pixi-tree';
import { Timeline } from './timeline';
import type { Composition } from '../..';

export interface ManualTestCase {
  key: string;
  name: string;
  description: string;
  expectedBehavior: string;
  start?: () => Promise<void> | void;
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
  private controlsContainer: HTMLElement;
  private verificationContainer: HTMLElement;
  private timelineContainer: HTMLElement;
  private testCaseRunning: ManualTestCase | null = null;
  private timeline: Timeline | null = null;
  private pixiTree: PixiTree | null = null;
  private composition: Composition | null = null;

  constructor(containerId: string) {
    this.container = document.querySelector(`#${containerId}`) || document.body;
    this.controlsContainer = document.querySelector('#test-controls-container') || document.body;
    this.verificationContainer = document.querySelector('#test-verification-controls') || document.body;
    this.timelineContainer = document.querySelector('#timeline-container') || document.body;
    this.setupTabs();
  }

  private setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    for (const button of tabButtons) {
      button.addEventListener('click', () => {
        const tabId = (button as HTMLElement).dataset.tab;

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

  public async start(testKey: string) {
    if (this.testCases.length === 0) {
      console.warn('No test cases added');
      return;
    }

    const testIndex = this.testCases.findIndex((testToCheck) => testToCheck.key === testKey);
    if (testIndex === -1) {
      console.warn(`Test with key ${testKey} not found`);
      return;
    }

    this.testCaseRunning = this.testCases[testIndex];
    this.currentTestIndex = testIndex;
    await this.runTest(this.testCaseRunning);
  }

  private async runTest(test: ManualTestCase) {
    const container = document.querySelector('#test-container');
    const controlsContainer = document.querySelector('#test-controls-container');
    if (!container || !controlsContainer) {
      throw new Error('Test container or controls container not found');
    }

    this.displayTestInfo(test);
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
      this.timeline = new Timeline(this.timelineContainer, composition);
      this.timeline.render();

      // Initialize Pixi.js tree
      const pixiTreeContainer = document.querySelector('#pixi-tree-container');
      const tooltip = document.querySelector('.tooltip');
      if (pixiTreeContainer && tooltip) {
        this.pixiTree = new PixiTree(pixiTreeContainer as HTMLElement, tooltip as HTMLElement, composition);
        this.pixiTree.render();
        this.pixiTree.startAutoUpdate(1000); // Update every second
      }

      const progress = document.createElement('div');
      progress.innerHTML = 'Playback progress: 0%';
      controlsContainer.append(progress);

      composition.onTimeUpdate((currentTime, totalDuration) => {
        progress.innerHTML = `Progress: ${((currentTime / totalDuration) * 100).toFixed(2)}%`;
      });

      const testControlsContainer = document.querySelector('#test-controls-container');
      if (testControlsContainer) {
        (testControlsContainer as HTMLDivElement).style.display = 'block';
      }
    }

    if (test.start) {
      await test.start();
    }

    this.showVerificationButtons();
  }

  private displayTestInfo(test: ManualTestCase) {
    this.container.innerHTML = `
        <div class="test-info">
          <h2>Test ${this.currentTestIndex + 1}/${this.testCases.length}: ${test.name}</h2>
          <p><strong>Description:</strong> ${test.description}</p>
          <p><strong>Expected Behavior:</strong> ${test.expectedBehavior}</p>
        </div>
        <div id="test-content"></div>
      `;
  }

  private showVerificationButtons() {
    if (!this.verificationContainer) {
      return;
    }

    this.verificationContainer.innerHTML = `
        <button onclick="window.__testRunner.verifyTest(true)">Pass</button>
        <button onclick="window.__testRunner.verifyTest(false)">Fail</button>
      `;

    // Make the test runner accessible globally for the buttons
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__testRunner = this;
  }

  public verifyTest(passed: boolean) {
    // Clean up
    this.pixiTree?.stopAutoUpdate();

    console.log('Test', this.testCaseRunning?.name, passed ? 'passed' : 'failed');
    const nextTest = this.testCases[this.currentTestIndex + 1] ?? '';
    if (nextTest) {
      globalThis.location.href = `?key=${nextTest.key}`;
    }

    alert('All tests are done!');
  }
}
