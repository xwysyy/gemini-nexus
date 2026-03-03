import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyIntoDist(relativePath) {
  const src = path.join(projectRoot, relativePath);
  const dest = path.join(distDir, relativePath);

  if (!(await pathExists(src))) {
    console.warn(`[prepare-dist] Skip missing: ${relativePath}`);
    return;
  }

  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.cp(src, dest, { recursive: true, force: true });
  console.info(`[prepare-dist] Copied: ${relativePath}`);
}

async function copyFileIntoDist(fromRelative, toRelative) {
  const src = path.join(projectRoot, fromRelative);
  const dest = path.join(distDir, toRelative);

  if (!(await pathExists(src))) {
    console.warn(`[prepare-dist] Skip missing: ${fromRelative}`);
    return;
  }

  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
  console.info(`[prepare-dist] Copied: ${fromRelative} -> ${toRelative}`);
}

if (!(await pathExists(distDir))) {
  throw new Error(
    `[prepare-dist] dist/ not found. Run the build first (npm run build) before prepare-dist.`,
  );
}

const staticItems = [
  'manifest.json',
  'metadata.json',
  'logo.png',
  'background',
  'content',
  'lib',
  'services',
  'css',
];

for (const item of staticItems) {
  await copyIntoDist(item);
}

await copyFileIntoDist('sandbox/theme_init.js', 'sandbox/theme_init.js');
