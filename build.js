import AdmZip from 'adm-zip';
import { po, mo } from 'gettext-parser';
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';

const __dirname = dirname(new URL(import.meta.url).pathname);
const resourcePath = resolve(__dirname, 'resources');
const poPath = resolve(__dirname, 'po');
const metadata = JSON.parse(readFileSync(resolve(resourcePath, 'metadata.json'), 'utf8'));
const distPath = resolve(__dirname, 'dist');
const zipPath = resolve(__dirname, `${metadata.uuid}.zip`);

cpSync(resourcePath, distPath, { recursive: true });
cpSync(resolve(__dirname, 'LICENSE'), resolve(distPath, 'LICENSE'));

for (const file of readdirSync(poPath).filter(file => file.endsWith('.po'))) {
  const localePath = resolve(distPath, 'locale', basename(file, '.po'), 'LC_MESSAGES');
  mkdirSync(localePath, { recursive: true });
  const translations = po.parse(readFileSync(resolve(poPath, file)));
  writeFileSync(resolve(localePath, `${metadata['gettext-domain']}.mo`), mo.compile(translations));
}

const zip = new AdmZip();
zip.addLocalFolder(distPath);
zip.writeZip(zipPath);
