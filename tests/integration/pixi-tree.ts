import { Container } from 'pixi.js';
import type { ContainerChild } from 'pixi.js';
import type { Composition } from '../..';

export class PixiTree {
  private container: HTMLElement;
  private tooltip: HTMLElement;
  private composition: Composition;
  private updateInterval: number | null = null;

  constructor(container: HTMLElement, tooltip: HTMLElement, composition: Composition) {
    this.container = container;
    this.tooltip = tooltip;
    this.composition = composition;
    this.setupTooltip();
  }

  private setupTooltip() {
    this.container.addEventListener('mousemove', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('tree-node')) {
        this.tooltip.style.left = `${event.pageX + 10}px`;
        this.tooltip.style.top = `${event.pageY + 10}px`;
        this.tooltip.style.display = 'block';
        this.tooltip.textContent = target.dataset['attributes'] || '';
      }
    });

    this.container.addEventListener('mouseleave', () => {
      this.tooltip.style.display = 'none';
    });
  }

  private getObjectAttributes(object: ContainerChild): string {
    const attributes: string[] = [];

    attributes.push(
      `x: ${object.x}`,
      `y: ${object.y}`,
      `width: ${object.width}`,
      `height: ${object.height}`,
      `alpha: ${object.alpha}`,
      `visible: ${object.visible}`,
      `scale: (${object.scale.x}, ${object.scale.y})`,
      `rotation: ${object.rotation}`
    );

    return attributes.join(', ');
  }

  private renderNode(object: ContainerChild, level: number = 0): HTMLElement {
    const node = document.createElement('div');
    node.className = `tree-node ${level > 0 ? 'tree-node-indent' : ''} ${object.visible ? '' : 'tree-node-invisible'}`;

    const name = object.constructor.name;
    const visibility = object.visible ? '👁️' : '👁️‍🗨️';
    node.textContent = `${visibility} ${name}`;

    node.dataset['attributes'] = this.getObjectAttributes(object);

    if (object instanceof Container && object.children.length > 0) {
      for (const child of object.children) {
        node.append(this.renderNode(child, level + 1));
      }
    }

    return node;
  }

  public render() {
    this.container.innerHTML = '';
    const stage = this.composition['app'].stage;
    this.container.append(this.renderNode(stage));
  }

  public startAutoUpdate(intervalMs: number = 1000) {
    if (this.updateInterval !== null) {
      this.stopAutoUpdate();
    }

    // @ts-expect-error TS is not properly recognizing this is a web setInterval, not a node Timeout.
    this.updateInterval = globalThis.setInterval(() => {
      this.render();
    }, intervalMs);
  }

  public stopAutoUpdate() {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}
