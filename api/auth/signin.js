// api/auth/signin.js — Kullanıcı giriş endpoint'i
const { supabase } = require('../lib/supabase');
const { setAuthCookie } = require('../lib/auth');
const { getJsonBody } = require('../lib/json-body');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ sonuc: 'method_not_allowed' });
    const { kul_id, kul_sifre } = getJsonBody(req);
    if (!kul_id?.trim() || !kul_sifre) return res.json({ sonuc: 'bos' });

    const { data: user, error } = await supabase.from('kullanicilar').select('*').eq('kullaniciadi', kul_id.trim()).single();
    if (error || !user) return res.json({ sonuc: 'yanlis' });

    const hash = user.sifre || '';
    let authOk = false;
    try {
      if (hash.startsWith('$') && (await bcrypt.compare(kul_sifre, hash))) authOk = true;
      else if (!hash.startsWith('$') && hash === kul_sifre) {
        authOk = true;
        const newHash = await bcrypt.hash(kul_sifre, 10);
        await supabase.from('kullanicilar').update({ sifre: newHash }).eq('id', user.id);
      }
    } catch {
      return res.json({ sonuc: 'yanlis' });
    }
    if (!authOk) return res.json({ sonuc: 'yanlis' });

    setAuthCookie(res, user.kullaniciadi, user.k_rol || '');
    return res.json({ sonuc: 'tamam' });
  } catch (e) {
    console.error('[signin]', e?.message || e);
    return res.status(500).json({
      sonuc: 'sunucu',
      mesaj: process.env.NODE_ENV === 'development' ? String(e?.message || e) : 'Sunucu yapılandırmasını kontrol edin (Supabase env).',
    });
  }
};
