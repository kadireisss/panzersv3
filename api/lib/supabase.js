// api/lib/supabase.js — Supabase client (server-side), ilk API çağrısında oluşturulur
const { createClient } = require('@supabase/supabase-js');

let _client;

function getClient() {
  if (_client) return _client;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('[PANZER] Supabase env eksik: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY');
  }
  _client = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  return _client;
}

const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      return getClient()[prop];
    },
  }
);

module.exports = { supabase };
