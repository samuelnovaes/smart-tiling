import { vi } from 'vitest';
import Widget from '../widget.js';

export class Button extends Widget {
  args: unknown[];

  pseudoClasses = new Set<string>();

  add_child = vi.fn();

  destroy = vi.fn();

  constructor(...args: unknown[]) {
    super();
    this.args = args;
  }

  add_style_pseudo_class(name: string) {
    this.pseudoClasses.add(name);
  }

  remove_style_pseudo_class(name: string) {
    this.pseudoClasses.delete(name);
  }
}
