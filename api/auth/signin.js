// api/auth/signin.js — Kullanıcı giriş endpoint'i
const { supabase } = require('../lib/supabase');
const { setAuthCookie } = require('../lib/auth');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ sonuc: 'method_not_allowed' });
  const { kul_id, kul_sifre } = req.body || {};
  if (!kul_id?.trim() || !kul_sifre) return res.json({ sonuc: 'bos' });

  const { data: user, error } = await supabase.from('kullanicilar').select('*').eq('kullaniciadi', kul_id.trim()).single();
  if (error || !user) return res.json({ sonuc: 'yanlis' });

  const hash = user.sifre || '';
  let authOk = false;
  if (hash.startsWith('$') && (await bcrypt.compare(kul_sifre, hash))) authOk = true;
  else if (!hash.startsWith('$') && hash === kul_sifre) { authOk = true; const newHash = await bcrypt.hash(kul_sifre, 10); await supabase.from('kullanicilar').update({ sifre: newHash }).eq('id', user.id); }
  if (!authOk) return res.json({ sonuc: 'yanlis' });

  setAuthCookie(res, user.kullaniciadi, user.k_rol || '');
  return res.json({ sonuc: 'tamam' });
};
