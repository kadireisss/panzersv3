#!/usr/bin/env node
/**
 * Supabase Postgres üzerinde database/schema.sql çalıştırır.
 * .env: DATABASE_URL (Direct / 5432 önerilir)
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
  console.error('   Supabase → Project Settings → Database → Connection string → URI');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
const raw = fs.readFileSync(schemaPath, 'utf8');
const lines = raw
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l.length > 0 && !l.startsWith('--'));

/** Her satır tek bir CREATE TABLE; pooler/driver çoklu statement sorunlarından kaçınır */
const statements = lines
  .map((l) => (l.endsWith(';') ? l : `${l};`))
  .filter((l) => /^create\s+/i.test(l.replace(/^;/, '')));

async function main() {
  const client = new Client({
    connectionString: conn,
    ssl: conn.includes('localhost') || conn.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      await client.query(stmt);
      const preview = stmt.slice(0, 72).replace(/\s+/g, ' ');
      console.log(`✅ [${i + 1}/${statements.length}] ${preview}…`);
    }
    console.log('\n✅ Şema tamam:', schemaPath);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('❌ SQL hatası:', e.message);
  process.exit(1);
});
