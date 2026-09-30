export default {
  EVENT_PROPAGATE: false,
  EVENT_STOP: true,
  KEY_Escape: 0xff1b,
  KEY_BackSpace: 0xff08,
  ModifierType: { SHIFT_MASK: 0b0001, LOCK_MASK: 0b0010, CONTROL_MASK: 0b0100 },
  keyval_to_lower: (keyval: number) => keyval + 32
};
