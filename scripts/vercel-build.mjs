/**
 * Vercel Build Command: önce monorepo → php-app kopyası, sonra composer (varsa).
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const v3Root = path.join(__dirname, '..');

const s = spawnSync(process.execPath, [path.join(__dirname, 'sync-php-monorepo.mjs')], {
  stdio: 'inherit',
  cwd: v3Root,
});
if (s.status !== 0) {
  console.warn('[vercel-build] sync-php-monorepo çıkış:', s.status);
}

const phpApp = path.join(v3Root, 'php-app');
const comp = path.join(phpApp, 'composer.json');
if (fs.existsSync(comp)) {
  const r = spawnSync('composer', ['install', '--no-dev', '--optimize-autoloader', '-d', phpApp], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    console.warn('[vercel-build] composer uyarı kodu:', r.status);
  }
} else {
  console.warn('[vercel-build] php-app/composer.json yok — vendor atlandı.');
}

console.log('[vercel-build] Bitti.');
