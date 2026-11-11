import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output);
const files = (await readdir(root)).filter(name => /\.(html|css|js)$/.test(name));
for (const name of files) await cp(path.join(root, name), path.join(output, name));
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
console.log(`Prepared ${files.length} site files and assets in dist/.`);
