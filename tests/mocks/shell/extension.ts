import { vi } from 'vitest';

export class Extension {
  metadata: { name: string, uuid: string };

  uuid: string;

  getSettings = vi.fn();

  constructor(metadata: { name: string, uuid: string }) {
    this.metadata = metadata;
    this.uuid = metadata.uuid;
  }

  enable() {}

  disable() {}
}
