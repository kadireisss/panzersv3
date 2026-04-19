// api/panel/me.js — Mevcut kullanıcı bilgisi endpoint
const { supabase } = require('../lib/supabase');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const user = requireAuth(req, res);
  if (!user) return;
  const { data, error } = await supabase.from('kullanicilar')
    .select('id, kullaniciadi, bakiye, toplamalinan, tgkod, tgadresi, trxadresi, userimage, k_rol')
    .eq('kullaniciadi', user.kul_id).single();
  if (error || !data) return res.status(404).json({ sonuc: 'hata', mesaj: 'Kullanıcı bulunamadı.' });
  return res.json({ sonuc: 'tamam', kullanici: { id: data.id, kullaniciadi: data.kullaniciadi, bakiye: data.bakiye || '0', toplamalinan: data.toplamalinan || '0', tgkod: data.tgkod || null, tgadresi: data.tgadresi || '', trxadresi: data.trxadresi || '', userimage: data.userimage || '', rol: data.k_rol || '' } });
};
