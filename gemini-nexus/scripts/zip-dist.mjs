import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const releaseDir = path.join(projectRoot, 'release');

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function readVersion() {
  const manifestPath = path.join(projectRoot, 'manifest.json');
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  if (!manifest?.version) {
    throw new Error('manifest.json missing "version"');
  }
  return manifest.version;
}

await fs.mkdir(releaseDir, { recursive: true });

const version = await readVersion();
const zipName = `gemini-nexus-v${version}.zip`;
const zipPath = path.join(releaseDir, zipName);

await fs.rm(zipPath, { force: true });

await run('zip', ['-r', zipPath, '.'], { cwd: distDir });

console.info(`[zip-dist] Created: ${path.relative(projectRoot, zipPath)}`);

