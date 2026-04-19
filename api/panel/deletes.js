// api/panel/deletes.js — Tüm silme işlemleri
const { supabase } = require('../lib/supabase');
const { getSession, isAdmin, canTouchRecord } = require('../lib/auth');
const { deleteImages, deleteImage } = require('../lib/upload');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ sonuc: 'method_not_allowed' });
  const session = getSession(req);
  if (!session) return res.status(401).json({ sonuc: 'yetkisiz' });
  const { action, id: rawId } = req.body || {};
  const id = parseInt(rawId);
  if (!action || !id) return res.status(400).json({ sonuc: 'eksik_parametre' });

  if (action === 'delsahibinden') { const { data: rec } = await supabase.from('ilan_sahibinden').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImages([rec.resim1,rec.resim2,rec.resim3,rec.resim4,rec.resim5]); await supabase.from('ilan_sahibinden').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'deldolap') { const { data: rec } = await supabase.from('ilan_dolap').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImages([rec.resim1,rec.resim2,rec.resim3,rec.resim4,rec.resim5,rec.resim6,rec.saticipp]); await supabase.from('ilan_dolap').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delletgo') { const { data: rec } = await supabase.from('ilan_letgo').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImages([rec.resim1,rec.resim2,rec.resim3,rec.resim4,rec.resim5,rec.resim6,rec.saticipp]); await supabase.from('ilan_letgo').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delpttavm') { const { data: rec } = await supabase.from('ilan_pttavm').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImages([rec.resim1,rec.resim2,rec.resim3,rec.resim4,rec.resim5]); await supabase.from('ilan_pttavm').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delturkcell') { const { data: rec } = await supabase.from('ilan_turkcell').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImages([rec.resim1,rec.resim2,rec.resim3,rec.resim4,rec.resim5]); await supabase.from('ilan_turkcell').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delshopier') { const { data: rec } = await supabase.from('ilan_shopier').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImages([rec.resim1,rec.resim2,rec.resim3,rec.resim4,rec.resim5]); await supabase.from('ilan_shopier').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delyurtici') { const { data: rec } = await supabase.from('yurtici').select('ekleyen').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await supabase.from('yurtici').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'deltrendyol') { const { data: rec } = await supabase.from('ty_ilan').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImage(rec.urunresmi); await supabase.from('ty_ilan').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delhepsiburada') { const { data: rec } = await supabase.from('hb_urun').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImage(rec.urunresim); await supabase.from('hb_urun').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delmigros') { const { data: rec } = await supabase.from('bella_mg_urunler').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImages([rec.resim1,rec.resim2,rec.resim3,rec.resim4]); await supabase.from('bella_mg_urunler').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delpasaj2') { const { data: rec } = await supabase.from('bella_pj_urunler').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImages([rec.resim1,rec.resim2,rec.resim3,rec.resim4,rec.resim5]); await supabase.from('bella_pj_urunler').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delptt3') { const { data: rec } = await supabase.from('bella_ptt3_urunler').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImages([rec.resim1,rec.resim2,rec.resim3,rec.resim4,rec.resim5]); await supabase.from('bella_ptt3_urunler').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delbim') { const { data: rec } = await supabase.from('bella_bim_products').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImage(rec.ImageURL); await supabase.from('bella_bim_products').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'dela101') { const { data: rec } = await supabase.from('bella_a101_products').select('*').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await deleteImages([rec.ImageURL,rec.Image2URL,rec.Image3URL,rec.Image4URL]); await supabase.from('bella_a101_products').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delpttkargo') { const { data: rec } = await supabase.from('bella_pttkargo').select('ekleyen').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await supabase.from('bella_pttkargo').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delkart') { const { data: rec } = await supabase.from('kartlar').select('ekleyen').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await supabase.from('kartlar').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }
  if (action === 'delhesap') { const { data: rec } = await supabase.from('hesaplar').select('ekleyen').eq('id', id).single(); if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc:'yetkisiz' }); await supabase.from('hesaplar').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }

  // CASCADE USER DELETE
  if (action === 'deluser') {
    if (!isAdmin(session)) return res.json({ sonuc:'yetkisiz' });
    const { data: user } = await supabase.from('kullanicilar').select('kullaniciadi').eq('id', id).single();
    if (!user) return res.json({ sonuc:'bulunamadi' });
    const kul = user.kullaniciadi;
    for (const tbl of ['cekimtalepleri','hesaplar','ilan_dolap','ilan_facebook','ilan_letgo','ilan_pttavm','ilan_sahibinden','ilan_shopier','ilan_turkcell','ty_ilan','hb_urun','bella_mg_urunler','bella_pj_urunler','bella_ptt3_urunler','bella_bim_products','bella_a101_products','kartlar','profilshopier','yurtici']) {
      await supabase.from(tbl).delete().eq('ekleyen', kul);
    }
    await supabase.from('kullanicilar').delete().eq('id', id);
    return res.json({ sonuc:'tamam' });
  }

  // REF SİL
  if (action === 'delref') { if (!isAdmin(session)) return res.json({ sonuc:'yetkisiz' }); await supabase.from('refkodlari').delete().eq('id', id); return res.json({ sonuc:'tamam' }); }

  return res.status(400).json({ sonuc: 'bilinmeyen_action' });
};
