/**
 * BelllaSC monorepo kökünü (v3'ün bir üst klasörü) v3/php-app/ altına kopyalar.
 * Vercel: GitHub'da sadece v3 varsa üst klasör olmaz — sessiz çıkış (PHP devre dışı).
 * Tam PHP deploy için: bu script'i yerelde çalıştırıp php-app'i commit'leyin veya monorepo'yu tek repo yapın.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const v3Root = path.join(__dirname, '..');
const monoRoot = path.join(v3Root, '..');
const destRoot = path.join(v3Root, 'php-app');
const marker = path.join(monoRoot, 'BellaMain', 'index.php');

if (!fs.existsSync(marker)) {
  console.warn(
    '[sync-php-monorepo] BellaMain/index.php bulunamadı (monorepo yok). php-app oluşturulmadı — Vercel’de yalnızca Node API çalışır.'
  );
  process.exit(0);
}

/** Üst klasörden kopyalanmayanlar (v3 = bu proje; api = monorepo içi Node yedeği, php ile karışmasın) */
const SKIP_TOP = new Set(['v3', '.git', '.github', 'node_modules', '.vscode', 'php-app', 'api']);

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

console.log('[sync-php-monorepo] Kaynak:', monoRoot);
console.log('[sync-php-monorepo] Hedef:', destRoot);

rmrf(destRoot);
fs.mkdirSync(destRoot, { recursive: true });

for (const name of fs.readdirSync(monoRoot, { withFileTypes: true })) {
  if (SKIP_TOP.has(name.name)) continue;
  const from = path.join(monoRoot, name.name);
  const to = path.join(destRoot, name.name);
  fs.cpSync(from, to, { recursive: true, force: true });
}

const envFrom = path.join(monoRoot, '.env');
const envTo = path.join(destRoot, '.env');
if (fs.existsSync(envFrom)) {
  fs.copyFileSync(envFrom, envTo);
  console.log('[sync-php-monorepo] .env → php-app/.env kopyalandı (Vercel’de gizli env tercih edilir).');
}

console.log('[sync-php-monorepo] Tamam. Dosya sayısı:', countFiles(destRoot));

function countFiles(dir) {
  let n = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else n++;
    }
  };
  walk(dir);
  return n;
}
