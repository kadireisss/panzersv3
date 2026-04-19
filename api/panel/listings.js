// api/panel/listings.js — İlan listeleme endpoint'i
const { supabase } = require('../lib/supabase');
const { requireAuth } = require('../lib/auth');

const TABLE_MAP = {
  sahibinden: 'ilan_sahibinden', dolap: 'ilan_dolap', letgo: 'ilan_letgo',
  pttavm: 'ilan_pttavm', turkcell: 'ilan_turkcell', shopier: 'ilan_shopier',
  yurtici: 'yurtici',
  trendyol: 'ty_ilan', hepsiburada: 'hb_urun', migros: 'bella_mg_urunler',
  pasaj: 'bella_pj_urunler', ptt3: 'bella_ptt3_urunler',
  bim: 'bella_bim_products', a101: 'bella_a101_products',
  pttkargo: 'bella_pttkargo',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const user = requireAuth(req, res);
  if (!user) return;
  const { platform, page = '1', limit = '20' } = req.query;
  const table = TABLE_MAP[platform];
  if (!table) return res.status(400).json({ sonuc: 'hata', mesaj: 'Geçersiz platform.' });
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const from = (p - 1) * l;
  const to = from + l - 1;
  let query = supabase.from(table).select('*', { count: 'exact' });
  if (user.is_rol !== 'admin' && user.is_rol !== 'mod') query = query.eq('ekleyen', user.kul_id);
  const { data, error, count } = await query.order('id', { ascending: false }).range(from, to);
  if (error) return res.status(500).json({ sonuc: 'hata', mesaj: error.message });
  return res.json({ sonuc: 'tamam', ilanlar: data || [], toplam: count || 0, sayfa: p, limit: l });
};
