import { vi } from 'vitest';
import Widget from '../widget.js';

class PreferencesPage extends Widget {}

class PreferencesGroup extends Widget {}

class SpinRow extends Widget {}

class SwitchRow extends Widget {}

class ShortcutLabel extends Widget {
  set_accelerator(accelerator: string) {
    this.props.accelerator = accelerator;
  }
}

class ActionRow extends Widget {
  suffixes: unknown[] = [];

  add_suffix(suffix: unknown) {
    this.suffixes.push(suffix);
  }
}

class AlertDialog extends Widget {
  static instances: AlertDialog[] = [];

  responses = new Map<string, string>();

  controllers: unknown[] = [];

  add_response = vi.fn((id: string, label: string) => this.responses.set(id, label));

  add_controller = vi.fn((controller: unknown) => this.controllers.push(controller));

  present = vi.fn();

  close = vi.fn();

  constructor(props: Record<string, unknown>) {
    super(props);
    AlertDialog.instances.push(this);
  }
}

class PreferencesWindow extends Widget {}

export default {
  PreferencesPage,
  PreferencesGroup,
  SpinRow,
  SwitchRow,
  ShortcutLabel,
  ActionRow,
  AlertDialog,
  PreferencesWindow
};
