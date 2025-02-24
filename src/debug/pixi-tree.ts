import { Container } from 'pixi.js';
import type { ContainerChild } from 'pixi.js';
import type { Composition } from '../composition/composition';
import { logger } from '../utils/logger';

export class PixiTree {
  private container: HTMLElement;
  private tooltip: HTMLElement;
  private composition: Composition;
  private compositionListeners = new Set<string>();

  constructor(container: HTMLElement, tooltip: HTMLElement, composition: Composition) {
    this.container = container;
    this.tooltip = tooltip;
    this.composition = composition;
    this.setupStyles();
    this.setupTooltip();
  }

  private setupStyles() {
    const style = document.createElement('style');
    style.textContent = `      
      .tree-node {
        padding: 4px 0;
        cursor: pointer;
      }
      .tree-node:hover {
        background: #f0f0f0;
      }
      .tree-node-invisible {
        opacity: 0.5;
      }
      .tree-node-indent {
        margin-left: 20px;
      }
    `;
    document.head.append(style);
  }

  private setupTooltip() {
    // Make sure tooltip starts hidden
    this.tooltip.style.display = 'none';

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const showTooltip = (target: HTMLElement, event: MouseEvent) => {
      if (!target.classList.contains('tree-node')) {
        return;
      }

      const attributes = target.dataset['attributes'];
      if (!attributes) {
        return;
      }

      // Format the attributes nicely
      const formattedAttributes = attributes.split(', ').join('\n');

      this.tooltip.textContent = formattedAttributes;
      this.tooltip.style.display = 'block';

      // Position tooltip relative to mouse cursor with some offset
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      const tooltipRect = this.tooltip.getBoundingClientRect();

      // Check if tooltip would go off-screen to the right
      const rightOverflow = mouseX + tooltipRect.width + 20 > window.innerWidth;

      // eslint-disable-next-line unicorn/prefer-ternary
      if (rightOverflow) {
        // Position to the left of the cursor
        this.tooltip.style.left = `${mouseX - tooltipRect.width - 10}px`;
      } else {
        // Position to the right of the cursor
        this.tooltip.style.left = `${mouseX + 20}px`;
      }

      // Ensure tooltip doesn't go off-screen vertically
      let top = mouseY;
      if (top + tooltipRect.height > window.innerHeight) {
        top = window.innerHeight - tooltipRect.height - 10;
      }
      this.tooltip.style.top = `${top}px`;
    };

    this.container.addEventListener('mousemove', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      showTooltip(target, event);
    });

    this.container.addEventListener('mouseleave', () => {
      this.tooltip.style.display = 'none';
    });

    this.container.addEventListener('mouseout', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('tree-node')) {
        this.tooltip.style.display = 'none';
      }
    });
  }

  private getObjectAttributes(object: ContainerChild): string {
    const attributes: string[] = [];

    attributes.push(
      `Position: (${object.x.toFixed(1)}, ${object.y.toFixed(1)})`,
      `Size: ${object.width.toFixed(1)} × ${object.height.toFixed(1)}`,
      `Alpha: ${object.alpha.toFixed(2)}`,
      `Visible: ${object.visible}`,
      `Scale: (${object.scale.x.toFixed(2)}, ${object.scale.y.toFixed(2)})`,
      `Rotation: ${((object.rotation * 180) / Math.PI).toFixed(1)}°`
    );

    return attributes.join(', ');
  }

  private renderNode(object: ContainerChild, level: number = 0, index: number = 0): HTMLElement {
    const node = document.createElement('div');
    node.className = `tree-node ${level > 0 ? 'tree-node-indent' : ''} ${object.visible ? '' : 'tree-node-invisible'}`;

    const name = object.constructor.name;
    const visibility = object.visible ? '👁️' : '👁️‍🗨️';
    node.textContent = `${visibility} [${index}] ${name}`;

    node.dataset['attributes'] = this.getObjectAttributes(object);

    if (object instanceof Container && object.children.length > 0) {
      for (const [childIndex, child] of object.children.entries()) {
        node.append(this.renderNode(child, level + 1, childIndex));
      }
    }

    return node;
  }

  public render() {
    this.container.innerHTML = '';

    try {
      const app = this.composition['app'];
      logger.debug('PIXI Debug - App:', app);

      const stage = app?.stage;
      logger.debug('PIXI Debug - Stage:', stage);

      if (!stage) {
        const error = document.createElement('div');
        error.style.cssText = 'color: #ff6b6b; padding: 16px; text-align: center;';
        error.textContent = 'No PIXI stage found in composition';
        this.container.append(error);
        return;
      }

      // Add debug info at the top
      const debugInfo = document.createElement('div');
      debugInfo.style.cssText =
        'color: #aaa; padding: 8px; font-family: monospace; font-size: 12px; border-bottom: 1px solid #444;';
      debugInfo.textContent = `Stage children: ${stage.children.length}, Stage visible: ${stage.visible}`;
      this.container.append(debugInfo);

      // Add the actual tree
      const treeRoot = this.renderNode(stage, 0, 0);
      treeRoot.style.marginTop = '8px';
      this.container.append(treeRoot);
    } catch (error) {
      logger.debug('PIXI Debug - Error:', error);
      const errorElement = document.createElement('div');
      errorElement.style.cssText = 'color: #ff6b6b; padding: 16px; text-align: center;';
      errorElement.textContent = errorElement instanceof Error ? errorElement.message : 'Failed to render PIXI stage';
      this.container.append(errorElement);
    }
  }

  public startAutoUpdate() {
    // Subscribe to both time and composition update events
    const timeId = this.composition.on('time', () => {
      this.render();
    });
    const compositionId = this.composition.on('composition', () => {
      this.render();
    });

    this.compositionListeners.add(timeId);
    this.compositionListeners.add(compositionId);
  }

  public stopAutoUpdate() {
    // Unsubscribe from all events
    for (const id of this.compositionListeners) {
      this.composition.off('time', id);
      this.composition.off('composition', id);
    }
    this.compositionListeners.clear();
  }
}
