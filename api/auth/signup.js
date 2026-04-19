// api/auth/signup.js — Kullanıcı kayıt endpoint'i
const { supabase } = require('../lib/supabase');
const { randomCode } = require('../lib/helpers');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ sonuc: 'method_not_allowed' });
  const { kul_id, kul_sifre, ref_kod } = req.body || {};
  if (!kul_id?.trim() || !kul_sifre || !ref_kod) return res.json({ sonuc: 'bos' });

  const { data: ref } = await supabase.from('refkodlari').select('*').eq('ref_code', ref_kod.trim()).single();
  if (!ref) return res.json({ sonuc: 'refhata' });

  const { data: exists } = await supabase.from('kullanicilar').select('id').eq('kullaniciadi', kul_id.trim()).single();
  if (exists) return res.json({ sonuc: 'var' });

  const tgkod = randomCode(8);
  const hashPw = await bcrypt.hash(kul_sifre, 10);
  const { error } = await supabase.from('kullanicilar').insert({ kullaniciadi: kul_id.trim(), sifre: hashPw, tgkod, bakiye: '0', toplamalinan: '0' });
  if (error) return res.json({ sonuc: 'hata', mesaj: error.message });
  await supabase.from('refkodlari').delete().eq('ref_code', ref_kod.trim());
  return res.json({ sonuc: 'tamam' });
};
