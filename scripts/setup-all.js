#!/usr/bin/env node
// Şema (Postgres) + panel seed — sırayla
require('dotenv').config();
const { spawnSync } = require('child_process');
const path = require('path');

const node = process.execPath;
const root = path.join(__dirname, '..');

function run(script) {
  const r = spawnSync(node, [path.join(__dirname, script)], { stdio: 'inherit', cwd: root, env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log('═══ 1/2 database/schema.sql (Postgres) ═══\n');
run('apply-schema.js');
console.log('\n═══ 2/2 panel satırı (Supabase JS) ═══\n');
run('seed.js');
