// api/panel/post-yeni-pazaryeri.js — Migros, Pasaj, PTT+, BİM, A101
const formidable = require('formidable');
const fs = require('fs');
const { supabase } = require('../lib/supabase');
const { getSession } = require('../lib/auth');
const { uploadImage } = require('../lib/upload');

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true, maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => { if (err) return reject(err); const flat = {}; for (const [k,v] of Object.entries(fields)) flat[k]=Array.isArray(v)?v[0]:v; resolve({ fields: flat, files }); });
  });
}

async function uploadMultiple(files, prefix, count, subfolder) {
  const res = {};
  for (let i=1;i<=count;i++) { const key=`${prefix}${i}`; const file=files[key]; if (file&&file.size>0) { const f=Array.isArray(file)?file[0]:file; res[key]=await uploadImage(fs.readFileSync(f.filepath),f.originalFilename||'img.jpg',f.mimetype,subfolder); } else { res[key]=null; } }
  return res;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ sonuc: 'method_not_allowed' });
  const session = getSession(req);
  if (!session) return res.status(401).json({ sonuc: 'yetkisiz' });
  const ct = req.headers['content-type'] || '';
  let fields = req.body || {}; let files = {};
  if (ct.includes('multipart/form-data')) { const parsed = await parseForm(req); fields = parsed.fields; files = parsed.files; }

  if ('migrosekle' in fields) { const imgs=await uploadMultiple(files,'resim',4,'migros'); await supabase.from('bella_mg_urunler').insert({ urunismi:fields.urunismi||'', urunlink:fields.urunlink||'', urunkat:fields.urunkat||'', fiyat:fields.fiyat||'', urunkodu:fields.urunkodu||'', hakkinda:fields.hakkinda||'', ozellik:fields.ozellik||'', iban:fields.iban||'', ...imgs, ekleyen:session.kul_id }); return res.json({ sonuc:'tamam' }); }
  if ('pasaj2ekle' in fields) { const imgs=await uploadMultiple(files,'resim',5,'pasaj'); await supabase.from('bella_pj_urunler').insert({ urunismi:fields.urunismi||'', urunlink:fields.urunlink||'', fiyat:fields.fiyat||'', hakkinda:fields.hakkinda||'', kat1:fields.kat1||'', kat2:fields.kat2||'', kat3:fields.kat3||'', saticiadi:fields.saticiadi||'', urunkodu:fields.urunkodu||'', urunkat:fields.urunkat||'', ozellik:fields.ozellik||'', iban:fields.iban||'', ...imgs, ekleyen:session.kul_id }); return res.json({ sonuc:'tamam' }); }
  if ('ptt3ekle' in fields) { const imgs=await uploadMultiple(files,'resim',5,'ptt3'); await supabase.from('bella_ptt3_urunler').insert({ urunismi:fields.urunismi||'', urunlink:fields.urunlink||'', fiyat:fields.fiyat||'', hakkinda:fields.hakkinda||'', urunkat:fields.urunkat||'', urunkodu:fields.urunkodu||'', ozellik:fields.ozellik||'', iban:fields.iban||'', ...imgs, ekleyen:session.kul_id }); return res.json({ sonuc:'tamam' }); }
  if ('bimonlineekle' in fields) { let ImageURL=null; if (files.ImageURL?.size>0) { const f=Array.isArray(files.ImageURL)?files.ImageURL[0]:files.ImageURL; ImageURL=await uploadImage(fs.readFileSync(f.filepath),f.originalFilename||'img.jpg',f.mimetype,'bim'); } await supabase.from('bella_bim_products').insert({ ProductName:fields.ProductName||'', ImageURL, ProductSefURL:fields.ProductSefURL||'', ProductPrice:parseInt(fields.ProductPrice)||0, ProductProperties:fields.ProductProperties||'', ProductBrand:fields.ProductBrand||'', ProductCode:parseInt(fields.ProductCode)||0, ekleyen:session.kul_id }); return res.json({ sonuc:'tamam' }); }
  if ('a101ekle' in fields) { const imgFields=['ImageURL','Image2URL','Image3URL','Image4URL']; const imgs={}; for (const key of imgFields) { const file=files[key]; if (file?.size>0) { const f=Array.isArray(file)?file[0]:file; imgs[key]=await uploadImage(fs.readFileSync(f.filepath),f.originalFilename||'img.jpg',f.mimetype,'a101'); } else imgs[key]=null; } await supabase.from('bella_a101_products').insert({ ProductName:fields.ProductName||'', ProductSefURL:fields.ProductSefURL||'', ProductPrice:parseInt(fields.ProductPrice)||0, ProductProperties:fields.ProductProperties||'', ProductBrand:fields.ProductBrand||'', ProductCode:parseInt(fields.ProductCode)||0, ...imgs, ekleyen:session.kul_id }); return res.json({ sonuc:'tamam' }); }

  return res.status(400).json({ sonuc: 'bilinmeyen_action' });
};
