// api/panel/profil.js — Profil güncelleme (from original)
const { supabase } = require('../lib/supabase');
const { getJsonBody } = require('../lib/json-body');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const user = requireAuth(req, res); if (!user) return;
  const body = getJsonBody(req);
  const { action } = body;
  if (action === 'trx') { const { trxadresi } = body; if (!trxadresi||trxadresi.length<10) return res.status(400).json({ sonuc:'hata', mesaj:'Geçersiz TRX.' }); await supabase.from('kullanicilar').update({ trxadresi }).eq('kullaniciadi', user.kul_id); return res.json({ sonuc:'tamam' }); }
  if (action === 'sifredegis') { const bcrypt=require('bcryptjs'); const { eski_sifre,yeni_sifre }=body; if (!eski_sifre||!yeni_sifre||yeni_sifre.length<4) return res.status(400).json({ sonuc:'hata' }); const { data:userData }=await supabase.from('kullanicilar').select('sifre').eq('kullaniciadi',user.kul_id).single(); if (!userData) return res.status(404).json({ sonuc:'hata' }); const match=await bcrypt.compare(eski_sifre,userData.sifre); if (!match) return res.status(401).json({ sonuc:'hata', mesaj:'Şifre yanlış.' }); const hash=await bcrypt.hash(yeni_sifre,10); await supabase.from('kullanicilar').update({ sifre:hash }).eq('kullaniciadi',user.kul_id); return res.json({ sonuc:'tamam' }); }
  if (action === 'tgkod') { const { randomCode }=require('../lib/helpers'); const kod=randomCode(6); await supabase.from('kullanicilar').update({ tgkod:kod }).eq('kullaniciadi',user.kul_id); return res.json({ sonuc:'tamam', tgkod:kod }); }
  if (action === 'avatar') { const { userimage }=body; if (!userimage) return res.status(400).json({ sonuc:'hata' }); await supabase.from('kullanicilar').update({ userimage }).eq('kullaniciadi',user.kul_id); return res.json({ sonuc:'tamam' }); }
  return res.status(400).json({ sonuc:'hata', mesaj:'Geçersiz action.' });
};
