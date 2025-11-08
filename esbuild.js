import AdmZip from 'adm-zip';
import { build } from 'esbuild';
import { cpSync, readFileSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';
import os from 'os';

const __dirname = dirname(new URL(import.meta.url).pathname);
const resourcePath = resolve(__dirname, 'resources');
const metadata = JSON.parse(readFileSync(resolve(resourcePath, 'metadata.json'), 'utf8'));
const distPath = resolve(os.homedir(), '.local/share/gnome-shell/extensions', metadata.uuid);
const zipPath = resolve(__dirname, `${metadata.uuid}.zip`);

rmSync(distPath, { recursive: true, force: true });

await build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outdir: distPath,
  treeShaking: false,
  target: 'firefox78',
  platform: 'node',
  format: 'esm',
  external: ['gi://*', 'resource://*']
});

cpSync(resourcePath, distPath, { recursive: true });
execSync(`glib-compile-schemas ${distPath}/schemas`);

const zip = new AdmZip();
zip.addLocalFolder(distPath);
zip.writeZip(zipPath);
