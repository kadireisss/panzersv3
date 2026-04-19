#!/usr/bin/env node
// scripts/seed.js — Şema SQL dosyası yolunu gösterir + panel satırı ekler (tablolar hazırsa)
// 1) database/schema.sql → Supabase SQL Editor'da çalıştırın
// 2) node scripts/seed.js  veya  npm run seed

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { getSupabaseUrl, getServiceRoleKey } = require('../api/lib/supabase-env');

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getServiceRoleKey();
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ .env: NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY gerekli.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  console.log('🐉 PANZER V3 — seed\n');
  if (fs.existsSync(schemaPath)) {
    console.log('📋 Şema dosyası:', schemaPath);
    console.log('   → Supabase Dashboard → SQL Editor → bu dosyayı yapıştırıp Run.\n');
  }

  const { data: existingPanel, error: panelErr } = await supabase.from('panel').select('id').eq('id', 1).maybeSingle();
  if (panelErr) {
    console.error('❌ panel tablosuna erişilemedi. Önce database/schema.sql çalıştırın.');
    console.error('   ', panelErr.message);
    process.exit(1);
  }
  if (!existingPanel) {
    const { error: insErr } = await supabase.from('panel').insert({ id: 1 });
    if (insErr) {
      console.error('❌ Panel satırı eklenemedi:', insErr.message);
      process.exit(1);
    }
    console.log('✅ Panel satırı (id=1) eklendi.');
  } else {
    console.log('ℹ️  Panel satırı zaten var.');
  }
  console.log('\n🐉 Bitti. İlk admin ve ref kodunu kendi sürecinizle ekleyin.');
}

seed().catch((e) => {
  console.error('❌ Seed hatası:', e);
  process.exit(1);
});
