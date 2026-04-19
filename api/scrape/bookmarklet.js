// api/scrape/bookmarklet.js — Bookmarklet'ten gelen veriyi DB'ye kaydet
const { supabase } = require('../lib/supabase');
const { requireAuth } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireAuth(req, res);
  if (!user) return;

  const { platform, title, price, description, images, url } = req.body;
  if (!platform || !title) return res.status(400).json({ sonuc:'hata', mesaj:'Platform ve başlık zorunludur.' });

  const TABLE_MAP = { sahibinden:'ilan_sahibinden', dolap:'ilan_dolap', letgo:'ilan_letgo', pttavm:'ilan_pttavm', turkcell:'ilan_turkcell', shopier:'ilan_shopier', trendyol:'ty_ilan', hepsiburada:'hb_urun', migros:'bella_mg_urunler', pasaj:'bella_pj_urunler', bim:'bella_bim_products', a101:'bella_a101_products' };
  const table = TABLE_MAP[platform];
  if (!table) return res.status(400).json({ sonuc:'hata', mesaj:`Desteklenmeyen platform: ${platform}` });

  try {
    const insertData = { ekleyen: user.kul_id };
    const imgs = images || [];
    switch (platform) {
      case 'sahibinden': Object.assign(insertData, { urunadi:title, urunfiyati:price||'', aciklama:description||'', resim1:imgs[0]||'', resim2:imgs[1]||'', resim3:imgs[2]||'', resim4:imgs[3]||'', resim5:imgs[4]||'' }); break;
      case 'dolap': Object.assign(insertData, { urunadi:title, urunfiyati:price||'', aciklama:description||'', resim1:imgs[0]||'', resim2:imgs[1]||'', resim3:imgs[2]||'', resim4:imgs[3]||'', resim5:imgs[4]||'', resim6:imgs[5]||'' }); break;
      case 'letgo': Object.assign(insertData, { urunadi:title, urunfiyati:price||'', aciklama:description||'', resim1:imgs[0]||'', resim2:imgs[1]||'', resim3:imgs[2]||'', resim4:imgs[3]||'', resim5:imgs[4]||'', resim6:imgs[5]||'' }); break;
      case 'trendyol': Object.assign(insertData, { urunadi:title, urunfiyat:price||'', urunaciklama:description||'', urunresmi:imgs[0]||'' }); break;
      case 'hepsiburada': Object.assign(insertData, { urunadi:title, urunfiyat:price||'', urunresim:imgs[0]||'', urunlink:url||'' }); break;
      case 'migros': Object.assign(insertData, { urunismi:title, fiyat:price||'', hakkinda:description||'', urunlink:url||'', resim1:imgs[0]||'', resim2:imgs[1]||'', resim3:imgs[2]||'' }); break;
      case 'pasaj': Object.assign(insertData, { urunismi:title, fiyat:price||'', hakkinda:description||'', urunlink:url||'', resim1:imgs[0]||'', resim2:imgs[1]||'', resim3:imgs[2]||'' }); break;
      case 'bim': Object.assign(insertData, { ProductName:title, ProductPrice:parseInt(String(price).replace(/\D/g,''))||0, ImageURL:imgs[0]||'', ProductSefURL:url||'' }); break;
      case 'a101': Object.assign(insertData, { ProductName:title, ProductPrice:parseInt(String(price).replace(/\D/g,''))||0, ImageURL:imgs[0]||'', Image2URL:imgs[1]||'', ProductSefURL:url||'' }); break;
      default: Object.assign(insertData, { urunadi:title, urunfiyati:price||'', aciklama:description||'', resim1:imgs[0]||'', resim2:imgs[1]||'' });
    }
    const { error } = await supabase.from(table).insert(insertData);
    if (error) throw error;
    return res.status(200).json({ sonuc:'tamam', mesaj:`${platform} ilanı kaydedildi.` });
  } catch (err) {
    console.error('[Bookmarklet]', err);
    return res.status(500).json({ sonuc:'hata', mesaj:err.message });
  }
};
