import { PixiTree } from './pixi-tree';
import { Timeline } from './timeline';
import type { Composition } from '../composition/composition';

export class DebugRenderer {
  private container: HTMLElement;
  private composition: Composition;
  private timeline!: Timeline;
  private pixiTree!: PixiTree;
  private currentTab: 'timeline' | 'pixitree' = 'timeline';

  constructor(container: HTMLElement, composition: Composition) {
    this.container = container;
    this.composition = composition;
    this.setupContainer();
  }

  private setupContainer() {
    // Create styles
    const style = document.createElement('style');
    style.textContent = `
      .debug-container {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      }
      .debug-tabs {
        display: flex;
        gap: 10px;
        padding: 10px;
        background: #1a1a1a;
      }
      .debug-tab {
        padding: 8px 16px;
        background: #333;
        border: none;
        color: white;
        cursor: pointer;
        border-radius: 4px;
        font-size: 13px;
      }
      .debug-tab.active {
        background: #555;
      }
      .debug-content {
        flex: 1;
        overflow: auto;
        padding: 10px;
        background: #2a2a2a;
        font-size: 13px;
      }
      .debug-panel {
        display: none;
      }
      .debug-panel.active {
        display: block;
      }
    `;
    document.head.append(style);

    // Create container structure
    this.container.innerHTML = `
      <div class="debug-container">
        <div class="debug-tabs">
          <button class="debug-tab active" data-tab="timeline">Timeline</button>
          <button class="debug-tab" data-tab="pixitree">Pixi Tree</button>
        </div>
        <div class="debug-content">
          <div class="debug-panel timeline active" id="timeline-panel"></div>
          <div class="debug-panel pixitree" id="pixitree-panel"></div>
        </div>
      </div>
    `;

    // Setup tab switching
    const tabs = this.container.querySelectorAll('.debug-tab');
    for (const tab of tabs) {
      tab.addEventListener('click', () => {
        const tabName = (tab as HTMLElement).dataset['tab'] as 'timeline' | 'pixitree';
        this.switchTab(tabName);
      });
    }

    // Create tooltip for pixi tree
    const tooltip = document.createElement('div');
    tooltip.className = 'pixi-tree-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      display: none;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      white-space: pre-wrap;
      z-index: 1000;
      pointer-events: none;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      max-width: 400px;
    `;
    document.body.append(tooltip);

    // Initialize components
    const timelinePanel = this.container.querySelector('#timeline-panel') as HTMLElement;
    const pixiTreePanel = this.container.querySelector('#pixitree-panel') as HTMLElement;

    this.timeline = new Timeline(timelinePanel, this.composition);
    this.pixiTree = new PixiTree(pixiTreePanel, tooltip, this.composition);

    // Initial render
    this.render();
  }

  private switchTab(tab: 'timeline' | 'pixitree') {
    this.currentTab = tab;

    // Update tab buttons
    const tabs = this.container.querySelectorAll('.debug-tab');
    for (const t of tabs) {
      t.classList.toggle('active', (t as HTMLElement).dataset['tab'] === tab);
    }

    // Update panels
    const panels = this.container.querySelectorAll('.debug-panel');
    for (const p of panels) {
      p.classList.toggle('active', p.classList.contains(tab));
    }

    // Render the active component
    this.render();
    if (tab === 'timeline') {
      this.pixiTree.stopAutoUpdate();
      this.timeline.startAutoUpdate();
    } else {
      this.timeline.stopAutoUpdate();
      this.pixiTree.startAutoUpdate();
    }
  }

  public render() {
    if (this.currentTab === 'timeline') {
      this.timeline.render();
    } else {
      this.pixiTree.render();
    }
  }

  public startAutoUpdate() {
    if (this.currentTab === 'pixitree') {
      this.pixiTree.startAutoUpdate();
    } else {
      this.timeline.startAutoUpdate();
    }
  }

  public stopAutoUpdate() {
    this.pixiTree.stopAutoUpdate();
    this.timeline.stopAutoUpdate();
  }
}
