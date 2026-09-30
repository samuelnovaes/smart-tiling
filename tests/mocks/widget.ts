import Signals from './signals.js';

export default class Widget extends Signals {
  children: unknown[] = [];

  constructor(public props: Record<string, unknown> = {}) {
    super();
  }

  add(child: unknown) {
    this.children.push(child);
  }
}
