# AGENTS.md

Guidance for AI coding agents working on **Smart Tiling**, a GNOME Shell extension
published on [extensions.gnome.org (EGO)](https://extensions.gnome.org/extension/8791/smart-tiling/).

Every change must keep the extension approvable under the
[EGO Review Guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html).
Versions 1–3 were rejected by reviewers; the lessons from those reviews are listed
in [Lessons from rejected submissions](#lessons-from-rejected-submissions) and
must not be repeated.

## Project layout

- `src/` — TypeScript sources, compiled one-to-one into `dist/` by `tsc`.
  - `extension.ts` — `Extension` subclass; only `enable()` / `disable()` lifecycle wiring.
  - `prefs.ts` — `ExtensionPreferences` subclass (runs in the GTK preferences process).
  - `tileManager.ts`, `tile.ts`, `keybindings.ts` — Shell-side logic, each class owning its own cleanup via `destroy()`.
  - `ambient.d.ts`, `position.d.ts` — type declarations only.
- `resources/` — copied as-is into the ZIP: `metadata.json`, `LICENSE`, `schemas/*.gschema.xml`.
- `build.js` — copies `resources/` into `dist/` and zips it as `<uuid>.zip`.

## Commands

```bash
npm ci            # install dependencies
npm run lint      # lint sources
npm run build     # tsc -> eslint --fix dist -> zip (smarttiling@samuelnovaes.zip)
gnome-extensions install --force smarttiling@samuelnovaes.zip
```

Always run `npm run lint` and `npm run build` before considering a change done.
Inspect the generated `dist/*.js`: reviewers read the **compiled JavaScript**, not the TypeScript.

## Lessons from rejected submissions

These came from actual EGO reviews of this extension:

1. **`metadata.json` must have a `url`** pointing to the GitHub/GitLab repository (v1).
2. **Do not use `version` in imports.** Write `import Gio from 'gi://Gio';`, never `'gi://Gio?version=2.0'` (v1).
3. **Do not bundle/transpile everything into one file.** Keep one output `.js` per source module, following the
   [GJS TypeScript guide](https://gjs.guide/extensions/development/typescript.html). No bundlers (esbuild, rollup, webpack…) (v1).
4. **Separate functions/methods with blank lines** — the compiled output must be readable (v1). The ESLint
   `lines-between-class-members` rule enforces this; keep `eslint --fix ./dist` in the build.
5. **Null out every reference in `disable()`**, including `Gio.Settings` objects and helper instances (v1):
   ```js
   this.gnomeKeybindingsSettings = null;
   this.mutterKeybindingsSettings = null;
   this.keybindings = null;
   ```
6. **Remove every main loop source (timeouts, idles) on destroy/disable** (v2), even ones whose callback
   returns `GLib.SOURCE_REMOVE`.
7. **Keep ownership of resources inside the class that creates them** (v3). Don't hoist timeouts or signals out
   of a class just so `extension.js` can clean them up. Instead, the class tracks its own sources/signals and
   exposes `destroy()`; the extension only does:
   ```js
   // enable()
   this.tileManager = new TileManager(this.settings);
   // disable()
   this.tileManager?.destroy();
   this.tileManager = null;
   ```

## EGO review rules

### Lifecycle

- **Nothing happens at import time or in the constructor of the `Extension` class**: no objects created, no signals
  connected, no main loop sources, no Shell modifications. Only static data (constants, `Map`, `RegExp`…) is allowed.
- **`enable()`** creates objects, connects signals, adds keybindings and main loop sources.
- **`disable()`** must undo *everything* `enable()` did:
  - destroy every object/widget created;
  - disconnect every signal using its stored handler ID;
  - remove every `GLib.timeout_add` / `GLib.idle_add` source with `GLib.source_remove`;
  - remove every keybinding (`Main.wm.removeKeybinding`);
  - restore any GNOME/Mutter setting that was changed (e.g. `settings.reset(key)`);
  - set every reference to `null`.
- Never disable selectively (e.g. keeping state alive across lock screen). Don't add `session-modes` unless
  `unlock-dialog` is truly required; if so, justify it with a comment in `disable()`.
- Track IDs in collections (`Set<number>`) inside the owning class and clear them in its `destroy()`,
  as `Tile` does for timeouts and signals.

### Imports and processes

- Shell process (`extension.ts` and its modules) **must not** import `Gtk`, `Gdk` or `Adw`.
- Preferences process (`prefs.ts`) **must not** import `Clutter`, `Meta`, `St`, `Shell` (or `Mtk`) or anything
  from `resource:///org/gnome/shell/ui/...`.
- Use `resource:///org/gnome/shell/extensions/extension.js` in the Shell and
  `resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js` in prefs.
- Deprecated modules are forbidden: `ByteArray` (use `TextDecoder`/`TextEncoder`), `Lang` (use ES classes),
  `Mainloop` (use `GLib.timeout_add`/`GLib.idle_add`).
- Avoid `GObject.Object.run_dispose()`; if unavoidable, add a comment explaining why.

### Code quality

- Output must be readable, structured JavaScript: no minification, no obfuscation, no bundling.
- Keep the existing style (2-space indent, single quotes, semicolons, no trailing commas, one blank line max).
- No excessive logging. Use `console.error` only for real failures; no debug `console.log` left behind.
- No dead code, unused imports, unused signal connections or speculative abstractions.
- Only use real APIs from the targeted GNOME Shell versions — check `@girs/gnome-shell` types and upstream
  GNOME Shell source. Never invent APIs.
- **AI-generated code policy:** EGO rejects submissions with unnecessary code, inconsistent style, imaginary API
  usage or leftover LLM prompts/comments. The author must be able to explain every line — keep changes minimal
  and idiomatic.

### metadata.json

- Required: `uuid`, `name`, `description`, `shell-version`, `url`. Also used here: `version`, `settings-schema`.
- `shell-version`: only stable releases actually tested, plus at most one development release.
- `url`: the GitHub repository.
- No unnecessary keys; omit `donations` and `session-modes` unless used.
- Bump `version` for each upload to EGO.

### GSettings

- Schema ID must start with `org.gnome.shell.extensions` and path with `/org/gnome/shell/extensions/`
  (here: `org.gnome.shell.extensions.smarttiling`).
- The XML file must ship in the ZIP as `schemas/<schema-id>.gschema.xml`.
- Changes to system settings (e.g. `org.gnome.desktop.wm.keybindings`, `org.gnome.mutter.keybindings`) must be
  reverted in `disable()`.

### Package contents

- The ZIP must contain only what the extension needs at runtime: compiled `.js`, `metadata.json`, `schemas/`,
  `LICENSE`. No build scripts, `node_modules`, TypeScript sources, source maps or unused media.
- No binaries or native libraries. External scripts, if ever needed, must be GJS and exit cleanly.
- Never spawn privileged processes (if unavoidable: `pkexec` on a non-user-writable executable).

### Legal and content

- License must be GPL-2.0-or-later compatible; credit any code borrowed from other extensions.
- No telemetry or tracking of any kind.
- No copyrighted/trademarked names or logos without permission; follow the GNOME Code of Conduct in names,
  descriptions and screenshots; no political statements.
- Clipboard access (not currently used) would need to be declared in the description and must not have
  default shortcuts.

### Preferences UI

- Build prefs with Adwaita widgets (`Adw.PreferencesPage` / `Group` / `Row`) following the GNOME HIG.
- Bind values with `settings.bind(...)` rather than manual signal handling where possible.

## Checklist before submitting to EGO

- [ ] `npm run lint` and `npm run build` pass without errors.
- [ ] `dist/` has one readable `.js` per source file, with blank lines between methods.
- [ ] No `?version=` in any `gi://` import.
- [ ] Every signal, timeout, keybinding and settings change made in `enable()` is undone in `disable()`, and
      every reference is set to `null`.
- [ ] No Shell modules imported in `prefs.js`, no GTK/Adw imported in the Shell side.
- [ ] `metadata.json` has `url`, correct `shell-version` list and bumped `version`.
- [ ] Extension tested with enable → disable → enable cycles (e.g. lock/unlock screen) without errors in
      `journalctl -f -o cat /usr/bin/gnome-shell`.
