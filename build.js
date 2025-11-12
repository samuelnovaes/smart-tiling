import AdmZip from 'adm-zip';
import { cpSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';

const __dirname = dirname(new URL(import.meta.url).pathname);
const resourcePath = resolve(__dirname, 'resources');
const metadata = JSON.parse(readFileSync(resolve(resourcePath, 'metadata.json'), 'utf8'));
const distPath = resolve(__dirname, 'dist');
const zipPath = resolve(__dirname, `${metadata.uuid}.zip`);

cpSync(resourcePath, distPath, { recursive: true });

const zip = new AdmZip();
zip.addLocalFolder(distPath);
zip.writeZip(zipPath);
