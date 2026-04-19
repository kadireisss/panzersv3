#!/usr/bin/env node
/**
 * Supabase bağlantısı + panel tablosu okunabilirliği (service role).
 * .env: NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { getSupabaseUrl, getServiceRoleKey } = require('../api/lib/supabase-env');

const url = getSupabaseUrl();
const key = getServiceRoleKey();
if (!url || !key) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL (veya SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env).');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await supabase.from('panel').select('id').eq('id', 1).maybeSingle();
  if (error) {
    console.error('❌ panel sorgusu başarısız:', error.message);
    console.error('   Tablo yoksa: npm run db:apply (DATABASE_URL ile) veya database/schema.sql → SQL Editor.');
    process.exit(1);
  }
  if (!data) console.log('⚠️  Bağlantı OK; panel id=1 satırı yok → npm run seed çalıştırın.');
  else console.log('✅ Supabase OK — panel satırı mevcut (id=1).');
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
