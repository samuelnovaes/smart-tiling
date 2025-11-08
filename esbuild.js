import AdmZip from 'adm-zip';
import { build } from 'esbuild';
import { copyFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';

const __dirname = dirname(new URL(import.meta.url).pathname);
const metadata = JSON.parse(readFileSync('./src/metadata.json', 'utf8'));

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

copyFileSync(
  resolve(__dirname, 'src/metadata.json'),
  resolve(__dirname, 'dist/metadata.json')
);

const zip = new AdmZip();
zip.addLocalFolder(resolve(__dirname, 'dist'));
zip.writeZip(resolve(__dirname, `${metadata.uuid}.zip`));
