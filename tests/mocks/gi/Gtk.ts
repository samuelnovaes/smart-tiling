import { vi } from 'vitest';
import Widget from '../widget.js';

class Adjustment extends Widget {}

class Button extends Widget {}

class EventControllerKey extends Widget {}

export default {
  Adjustment,
  Button,
  EventControllerKey,
  Align: { CENTER: 3 },
  PropagationPhase: { CAPTURE: 1 },
  accelerator_get_default_mod_mask: () => 0b1111,
  accelerator_valid: vi.fn(() => true),
  accelerator_name: (keyval: number, mask: number) => `<${mask}>${keyval}`
};
