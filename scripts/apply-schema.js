#!/usr/bin/env node
/**
 * Supabase Postgres üzerinde database/schema.sql çalıştırır.
 * .env içinde DATABASE_URL (Supabase → Settings → Database → URI, "Direct" veya "Session" önerilir) gerekli.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const conn =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL;
if (!conn) {
  console.error('❌ DATABASE_URL (veya SUPABASE_DB_URL) .env içinde tanımlı olmalı.');
  console.error('   Supabase Dashboard → Project Settings → Database → Connection string → URI');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
const raw = fs.readFileSync(schemaPath, 'utf8');
const sql = raw
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .trim();

async function main() {
  const client = new Client({
    connectionString: conn,
    ssl: conn.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log('✅ Şema uygulandı:', schemaPath);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('❌ SQL hatası:', e.message);
  process.exit(1);
});
