import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const localesSrc = path.join(root, 'locales');
const localesDst = path.join(publicDir, 'locales');

fs.mkdirSync(publicDir, { recursive: true });

if (fs.existsSync(localesSrc)) {
  fs.mkdirSync(localesDst, { recursive: true });
  for (const name of fs.readdirSync(localesSrc)) {
    if (!name.endsWith('.json')) continue;
    fs.copyFileSync(path.join(localesSrc, name), path.join(localesDst, name));
  }
}
