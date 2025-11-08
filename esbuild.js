import AdmZip from 'adm-zip';
import { build } from 'esbuild';
import { cpSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';

const __dirname = dirname(new URL(import.meta.url).pathname);
const resourcePath = resolve(__dirname, 'resources');
const distPath = resolve(__dirname, 'dist');
const metadata = JSON.parse(readFileSync(resolve(resourcePath, 'metadata.json'), 'utf8'));
const zipPath = resolve(__dirname, `${metadata.uuid}.zip`);

await build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outdir: 'dist',
  treeShaking: false,
  target: 'firefox78',
  platform: 'node',
  format: 'esm',
  external: ['gi://*', 'resource://*']
});

cpSync(resourcePath, distPath, { recursive: true });

const zip = new AdmZip();
zip.addLocalFolder(distPath);
zip.writeZip(zipPath);
