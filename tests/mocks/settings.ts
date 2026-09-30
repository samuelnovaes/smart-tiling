import { vi } from 'vitest';
import Signals from './signals.js';

export default class Settings extends Signals {
  private defaults: Map<string, unknown>;

  private values: Map<string, unknown>;

  bind = vi.fn();

  constructor(defaults: Record<string, unknown> = {}) {
    super();
    this.defaults = new Map(Object.entries(defaults));
    this.values = new Map(this.defaults);
  }

  private get(key: string) {
    return this.values.get(key);
  }

  private set(key: string, value: unknown) {
    this.values.set(key, value);
    this.emit(`changed::${key}`, key);
    this.emit('changed', key);
  }

  get_boolean(key: string) {
    return this.get(key) as boolean;
  }

  set_boolean(key: string, value: boolean) {
    this.set(key, value);
  }

  get_int(key: string) {
    return this.get(key) as number;
  }

  get_strv(key: string) {
    return this.get(key) as string[];
  }

  set_strv(key: string, value: string[]) {
    this.set(key, value);
  }

  reset(key: string) {
    this.set(key, this.defaults.get(key));
  }
}
