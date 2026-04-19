// api/panel/post.js — Ana Panel CRUD Handler (tüm POST işlemleri)
// Kullanım: POST /api/panel/post
// Body içindeki action key'e göre switch-case çalışır

const formidable = require('formidable');
const { getJsonBody } = require('../lib/json-body');
const { supabase } = require('../lib/supabase');
const { getSession, isAdmin, isModOrAdmin, canTouchRecord, sifrecozWadanz } = require('../lib/auth');
const { randomCode, randomId, todayTR, nowTimeTR, isAllowedImage } = require('../lib/helpers');
const { uploadImage, deleteImage, deleteImages } = require('../lib/upload');
const { sendMessage, setWebhook, deleteWebhook } = require('../lib/telegram');

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true, maxFileSize: 10 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const flat = {};
      for (const [k, v] of Object.entries(fields)) flat[k] = Array.isArray(v) ? v[0] : v;
      resolve({ fields: flat, files });
    });
  });
}

async function uploadMultipleImages(files, prefix = 'resim', count = 5, subfolder = '') {
  const results = {};
  for (let i = 1; i <= count; i++) {
    const key = `${prefix}${i}`;
    const file = files[key];
    if (file && file.size > 0) {
      const fileArr = Array.isArray(file) ? file[0] : file;
      const fs = require('fs');
      const buf = fs.readFileSync(fileArr.filepath);
      results[key] = await uploadImage(buf, fileArr.originalFilename || `upload.jpg`, fileArr.mimetype, subfolder);
    } else {
      results[key] = null;
    }
  }
  return results;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ sonuc: 'method_not_allowed' });
  const session = getSession(req);
  if (!session) return res.status(401).json({ sonuc: 'yetkisiz' });

  let fields = {};
  let files = {};
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    const parsed = await parseForm(req);
    fields = parsed.fields;
    files = parsed.files;
  } else {
    fields = getJsonBody(req);
  }

  // PANEL AYARLAR
  if ('panelduzenle' in fields) {
    if (!isModOrAdmin(session)) return res.json({ sonuc: 'yetkisiz' });
    const updateData = {
      dom_panel: fields.dom_panel||'', dom_sahibinden: fields.dom_sahibinden||'',
      dom_dolap: fields.dom_dolap||'', dom_letgo: fields.dom_letgo||'',
      dom_pttavm: fields.dom_pttavm||'', dom_turkcell: fields.dom_turkcell||'',
      dom_shopier: fields.dom_shopier||'', dom_yurtici: fields.dom_yurtici||'',
      dom_facebook: fields.dom_facebook||'', dom_trendyol: fields.dom_trendyol||'',
      dom_hepsiburada: fields.dom_hepsiburada||'', dom_migros: fields.dom_migros||'',
      dom_pasaj: fields.dom_pasaj||'', dom_ptt3: fields.dom_ptt3||'',
      dom_bim: fields.dom_bim||'', dom_a101: fields.dom_a101||'',
      dom_pttkargo: fields.dom_pttkargo||'',
      ibanad: fields.ibanad||'', iban: fields.iban||'', banka: fields.banka||'',
      adminbot_token: fields.adminbot_token||'', adminbot_chatid: fields.adminbot_chatid||'',
      cekimbot_token: fields.cekimbot_token||'', cekimbot_chatid: fields.cekimbot_chatid||'',
      dekontbot_token: fields.dekontbot_token||'', dekontbot_chatid: fields.dekontbot_chatid||'',
      vergibot_token: fields.vergibot_token||'', vergibot_chatid: fields.vergibot_chatid||'',
    };
    await supabase.from('panel').update(updateData).eq('id', 1);
    if (fields.iban) {
      for (const tbl of ['bella_a101_banks','bella_mg_banka','bella_pj_banka','bella_ptt3_banka']) {
        await supabase.from(tbl).update({ iban: fields.iban }).neq('id', 0);
      }
    }
    const baseUrl = process.env.WEBHOOK_BASE_URL || `https://${req.headers.host}`;
    if (updateData.adminbot_token) await setWebhook(updateData.adminbot_token, `${baseUrl}/api/bot/manager`);
    if (updateData.cekimbot_token) await setWebhook(updateData.cekimbot_token, `${baseUrl}/api/bot/cekimbot`);
    return res.json({ sonuc: 'tamam' });
  }

  // TG DENEME
  if ('telegram_deneme' in fields) {
    if (!isModOrAdmin(session)) return res.json({ sonuc: 'yetkisiz' });
    const { data: panel } = await supabase.from('panel').select('*').eq('id', 1).single();
    const tokenMap = { adminbot:[panel?.adminbot_token,panel?.adminbot_chatid], cekimbot:[panel?.cekimbot_token,panel?.cekimbot_chatid], dekontbot:[panel?.dekontbot_token,panel?.dekontbot_chatid], vergibot:[panel?.vergibot_token,panel?.vergibot_chatid] };
    const [tok,chat] = tokenMap[fields.hangi_bot] || [];
    if (!tok||!chat) return res.json({ sonuc:'hata', mesaj:'Token/Chat ID boş' });
    await sendMessage(tok, chat, `🐉 PANZER test mesajı — Bot aktif [${fields.hangi_bot}]`);
    return res.json({ sonuc: 'tamam' });
  }

  // PROFİL
  if ('profilduzenle' in fields) {
    const kul = session.kul_id;
    const { data: user } = await supabase.from('kullanicilar').select('*').eq('kullaniciadi', kul).single();
    if (!user) return res.json({ sonuc: 'hata' });
    let userimage = user.userimage || '';
    if (files.userimage?.size > 0) {
      if (userimage) await deleteImage(userimage);
      const fs = require('fs');
      const f = Array.isArray(files.userimage) ? files.userimage[0] : files.userimage;
      userimage = await uploadImage(fs.readFileSync(f.filepath), f.originalFilename||'profile.jpg', f.mimetype, 'profiles');
    }
    await supabase.from('kullanicilar').update({ trxadresi: fields.trxadresi||user.trxadresi, userimage }).eq('kullaniciadi', kul);
    return res.json({ sonuc: 'tamam' });
  }

  // ÇEKİM TALEBİ
  if ('cekimtalebi' in fields) {
    const kul = session.kul_id;
    const miktar = parseFloat(fields.miktar) || 0;
    const { data: user } = await supabase.from('kullanicilar').select('bakiye,trxadresi').eq('kullaniciadi', kul).single();
    if (!user) return res.json({ sonuc: 'hata' });
    const bakiye = parseFloat(user.bakiye) || 0;
    if (miktar < 500) return res.json({ sonuc: 'minHata' });
    if (miktar > bakiye) return res.json({ sonuc: 'bakiyeHata' });
    const islemid = randomId(12);
    await supabase.from('cekimtalepleri').insert({ miktar: String(miktar), trxadresi: user.trxadresi||'', durum:'Beklemede', tarih: todayTR(), saat: nowTimeTR(), islemid, ekleyen: kul });
    await supabase.from('kullanicilar').update({ bakiye: String(bakiye - miktar) }).eq('kullaniciadi', kul);
    const { data: panel } = await supabase.from('panel').select('cekimbot_token,cekimbot_chatid').eq('id', 1).single();
    if (panel?.cekimbot_token) {
      try {
        const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=TRXTRY');
        const priceData = await priceRes.json();
        const trxPrice = parseFloat(priceData.price) || 1;
        const netTL = miktar * 0.995;
        const trxAmt = Math.floor(netTL / trxPrice);
        const uniqueId = randomId(10);
        await supabase.from('cekim_callbacks').insert({ unique_id: uniqueId, islemid, ekleyen: kul, miktar: String(miktar) });
        const msg = `💸 *YENİ ÇEKİM TALEBİ*\n👤 Kullanıcı: ${kul}\n💰 Miktar: ${miktar} TL\n🔷 TRX: ${trxAmt}\n📋 İşlem ID: ${islemid}\n📅 ${todayTR()} ${nowTimeTR()}`;
        await sendMessage(panel.cekimbot_token, panel.cekimbot_chatid, msg, { parse_mode:'Markdown', reply_markup: JSON.stringify({ inline_keyboard:[[{ text:'✅ Onayla', callback_data:`approve_${uniqueId}` },{ text:'❌ Reddet', callback_data:`reject_${uniqueId}` }]] }) });
      } catch {}
    }
    return res.json({ sonuc: 'tamam' });
  }

  // SAHİBİNDEN EKLE
  if ('sahibindenekle' in fields) {
    const imgs = await uploadMultipleImages(files, 'resim', 5, 'sahibinden');
    const ozAd=[], ozDeger=[];
    for (let i=1;i<=20;i++) { if (fields[`ozellik_ad_${i}`]) { ozAd.push(fields[`ozellik_ad_${i}`]); ozDeger.push(fields[`ozellik_deger_${i}`]||''); } }
    await supabase.from('ilan_sahibinden').insert({ ilandurum:1, urunadi:fields.urunadi||'', adsoyad:fields.adsoyad||'', ilantarihi:fields.ilantarihi||todayTR(), ilanno:fields.ilanno||randomId(8), telno:fields.telno||'', urunfiyati:fields.urunfiyati||'', komisyon:fields.komisyon||'', aciklama:fields.aciklama||'', il:fields.il||'', ilce:fields.ilce||'', mahalle:fields.mahalle||'', kat1:fields.kat1||'', kat2:fields.kat2||'', kimden:fields.kimden||'', durumu:fields.durumu||'', kartibanselect:fields.kartibanselect||'', selectgiris:fields.selectgiris||'', ozellik_ad:ozAd.join('||'), ozellik_deger:ozDeger.join('||'), ...imgs, ekleyen:session.kul_id });
    return res.json({ sonuc: 'tamam' });
  }

  // SAHİBİNDEN DÜZENLE
  if ('sahibindenduzenle' in fields) {
    const id = parseInt(sifrecozWadanz(fields.sahibindenduzenle));
    const { data: rec } = await supabase.from('ilan_sahibinden').select('*').eq('id', id).single();
    if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc: 'yetkisiz' });
    const imgs = await uploadMultipleImages(files, 'resim', 5, 'sahibinden');
    const mergedImgs = {};
    for (let i=1;i<=5;i++) mergedImgs[`resim${i}`] = imgs[`resim${i}`] || rec[`resim${i}`] || null;
    await supabase.from('ilan_sahibinden').update({ urunadi:fields.urunadi||rec.urunadi, adsoyad:fields.adsoyad||rec.adsoyad, telno:fields.telno||rec.telno, urunfiyati:fields.urunfiyati||rec.urunfiyati, komisyon:fields.komisyon||rec.komisyon, aciklama:fields.aciklama||rec.aciklama, il:fields.il||rec.il, ilce:fields.ilce||rec.ilce, mahalle:fields.mahalle||rec.mahalle, kat1:fields.kat1||rec.kat1, kat2:fields.kat2||rec.kat2, kartibanselect:fields.kartibanselect||rec.kartibanselect, selectgiris:fields.selectgiris||rec.selectgiris, ...mergedImgs }).eq('id', id);
    return res.json({ sonuc: 'tamam' });
  }

  // DOLAP EKLE
  if ('dolapekle' in fields) {
    const imgs = await uploadMultipleImages(files, 'resim', 6, 'dolap');
    let saticipp = null;
    if (files.saticipp?.size > 0) { const fs=require('fs'); const f=Array.isArray(files.saticipp)?files.saticipp[0]:files.saticipp; saticipp = await uploadImage(fs.readFileSync(f.filepath), f.originalFilename||'pp.jpg', f.mimetype, 'dolap'); }
    await supabase.from('ilan_dolap').insert({ ilandurum:1, urunadi:fields.urunadi||'', adsoyad:fields.adsoyad||'', urunfiyati:fields.urunfiyati||'', aciklama:fields.aciklama||'', kat1:fields.kat1||'', kat2:fields.kat2||'', kat3:fields.kat3||'', indirim:fields.indirim||'', begeni:fields.begeni||'', puan:fields.puan||'', yorum:fields.yorum||'', alicisatici:fields.alicisatici||'', kullanim:fields.kullanim||'', kartibanselect:fields.kartibanselect||'', selectgiris:fields.selectgiris||'', saticipp, ...imgs, ekleyen:session.kul_id });
    return res.json({ sonuc: 'tamam' });
  }

  // DOLAP DÜZENLE
  if ('dolapduzenle' in fields) {
    const id = parseInt(sifrecozWadanz(fields.dolapduzenle));
    const { data: rec } = await supabase.from('ilan_dolap').select('*').eq('id', id).single();
    if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc: 'yetkisiz' });
    const imgs = await uploadMultipleImages(files, 'resim', 6, 'dolap');
    const mergedImgs = {};
    for (let i=1;i<=6;i++) mergedImgs[`resim${i}`] = imgs[`resim${i}`] || rec[`resim${i}`] || null;
    await supabase.from('ilan_dolap').update({ urunadi:fields.urunadi||rec.urunadi, urunfiyati:fields.urunfiyati||rec.urunfiyati, aciklama:fields.aciklama||rec.aciklama, kartibanselect:fields.kartibanselect||rec.kartibanselect, selectgiris:fields.selectgiris||rec.selectgiris, ...mergedImgs }).eq('id', id);
    return res.json({ sonuc: 'tamam' });
  }

  // LETGO EKLE
  if ('letgoekle' in fields) {
    const imgs = await uploadMultipleImages(files, 'resim', 6, 'letgo');
    let saticipp = null;
    if (files.saticipp?.size > 0) { const fs=require('fs'); const f=Array.isArray(files.saticipp)?files.saticipp[0]:files.saticipp; saticipp = await uploadImage(fs.readFileSync(f.filepath), f.originalFilename||'pp.jpg', f.mimetype, 'letgo'); }
    await supabase.from('ilan_letgo').insert({ ilandurum:1, urunadi:fields.urunadi||'', adsoyad:fields.adsoyad||'', urunfiyati:fields.urunfiyati||'', ilantarihi:fields.ilantarihi||todayTR(), ilanno:fields.ilanno||randomId(8), aciklama:fields.aciklama||'', il:fields.il||'', ilce:fields.ilce||'', kat1:fields.kat1||'', kat2:fields.kat2||'', kategori1:fields.kategori1||'', kategori2:fields.kategori2||'', kategori3:fields.kategori3||'', kategori4:fields.kategori4||'', kartibanselect:fields.kartibanselect||'', selectgiris:fields.selectgiris||'', saticipp, ...imgs, ekleyen:session.kul_id });
    return res.json({ sonuc: 'tamam' });
  }

  // PTTAVM EKLE
  if ('pttekle' in fields) {
    const imgs = await uploadMultipleImages(files, 'resim', 5, 'pttavm');
    await supabase.from('ilan_pttavm').insert({ ilandurum:1, urunadi:fields.urunadi||'', urunfiyati:fields.urunfiyati||'', aciklama:fields.aciklama||'', kat1:fields.kat1||'', kat2:fields.kat2||'', kat3:fields.kat3||'', kartibanselect:fields.kartibanselect||'', selectgiris:fields.selectgiris||'', ...imgs, ekleyen:session.kul_id });
    return res.json({ sonuc: 'tamam' });
  }

  // TURKCELL EKLE
  if ('turkcellekle' in fields) {
    const imgs = await uploadMultipleImages(files, 'resim', 5, 'turkcell');
    await supabase.from('ilan_turkcell').insert({ ilandurum:1, urunadi:fields.urunadi||'', urunfiyati:fields.urunfiyati||'', aciklama:fields.aciklama||'', kat1:fields.kat1||'', kat2:fields.kat2||'', kat3:fields.kat3||'', kartibanselect:fields.kartibanselect||'', selectgiris:fields.selectgiris||'', ...imgs, ekleyen:session.kul_id });
    return res.json({ sonuc: 'tamam' });
  }

  // SHOPİER EKLE
  if ('shopierekle' in fields) {
    const imgs = await uploadMultipleImages(files, 'resim', 5, 'shopier');
    await supabase.from('ilan_shopier').insert({ ilandurum:1, urunadi:fields.urunadi||'', adsoyad:fields.adsoyad||'', urunfiyati:fields.urunfiyati||'', aciklama:fields.aciklama||'', kat1:fields.kat1||'', kat2:fields.kat2||'', kat3:fields.kat3||'', kimden:fields.kimden||'', durumu:fields.durumu||'', kartibanselect:fields.kartibanselect||'', selectgiris:fields.selectgiris||'', ...imgs, ekleyen:session.kul_id });
    return res.json({ sonuc: 'tamam' });
  }

  // TRENDYOL EKLE
  if ('trendyolekle' in fields) {
    let urunresmi = null;
    if (files.urunresmi?.size > 0) { const fs=require('fs'); const f=Array.isArray(files.urunresmi)?files.urunresmi[0]:files.urunresmi; urunresmi = await uploadImage(fs.readFileSync(f.filepath), f.originalFilename||'ilan.jpg', f.mimetype, 'trendyol'); }
    await supabase.from('ty_ilan').insert({ urunadi:fields.urunadi||'', saticiadi:fields.saticiadi||'', urunaciklama:fields.urunaciklama||'', urunfiyat:fields.urunfiyat||'', urunkategori:fields.urunkategori||'', urunresmi, ilandurum:'1', ekleyen:session.kul_id });
    return res.json({ sonuc: 'tamam' });
  }

  // HEPSİBURADA EKLE
  if ('hepsiburadaekle' in fields) {
    let urunresim = null;
    if (files.urunresim?.size > 0) { const fs=require('fs'); const f=Array.isArray(files.urunresim)?files.urunresim[0]:files.urunresim; urunresim = await uploadImage(fs.readFileSync(f.filepath), f.originalFilename||'ilan.jpg', f.mimetype, 'hepsiburada'); }
    await supabase.from('hb_urun').insert({ urunlink:fields.urunlink||'', urunkategori:fields.urunkategori||'', urunadi:fields.urunadi||'', urunfiyat:fields.urunfiyat||'', urunresim, ekleyen:session.kul_id });
    return res.json({ sonuc: 'tamam' });
  }

  // PTT KARGO EKLE
  if ('pttkargoekle' in fields) {
    const takipno = fields.takipno?.trim() || '';
    if (!/^[A-Za-z0-9\-]{4,32}$/.test(takipno)) return res.json({ sonuc: 'formatHata' });
    const { data: existing } = await supabase.from('bella_pttkargo').select('id').eq('takipno', takipno).single();
    if (existing) return res.json({ sonuc: 'zatenVar' });
    await supabase.from('bella_pttkargo').insert({ takipno, gonderen:fields.gonderen||'', teslimalan:fields.teslimalan||'', cikistarih:fields.cikistarih||todayTR(), teslimtarih:fields.teslimtarih||'', cikisadres:fields.cikisadres||'', teslimadres:fields.teslimadres||'', telefonno:fields.telefonno||'', gonderil:fields.gonderil||'', alanil:fields.alanil||'', sonuc:fields.sonuc||'', durumu:parseInt(fields.durumu)||1, ekleyen:session.kul_id });
    return res.json({ sonuc: 'tamam' });
  }

  // PTT KARGO DÜZENLE
  if ('pttkargoduzenle' in fields) {
    const id = parseInt(sifrecozWadanz(fields.pttkargoduzenle));
    const { data: rec } = await supabase.from('bella_pttkargo').select('*').eq('id', id).single();
    if (!rec || !canTouchRecord(session, rec.ekleyen)) return res.json({ sonuc: 'yetkisiz' });
    await supabase.from('bella_pttkargo').update({ teslimtarih:fields.teslimtarih||rec.teslimtarih, teslimadres:fields.teslimadres||rec.teslimadres, sonuc:fields.sonuc||rec.sonuc, durumu:parseInt(fields.durumu)||rec.durumu }).eq('id', id);
    return res.json({ sonuc: 'tamam' });
  }

  // REF KOD EKLE
  if ('refekle' in fields) {
    if (!isAdmin(session)) return res.json({ sonuc: 'yetkisiz' });
    const kod = randomCode(8);
    await supabase.from('refkodlari').insert({ ref_code: kod });
    return res.json({ sonuc: 'tamam', kod });
  }

  // KULLANICI DÜZENLE
  if ('userduzenle' in fields) {
    if (!isAdmin(session)) return res.json({ sonuc: 'yetkisiz' });
    const id = parseInt(fields.user_id);
    const ekBakiye = parseFloat(fields.ekbakiye) || 0;
    const { data: user } = await supabase.from('kullanicilar').select('bakiye,toplamalinan').eq('id', id).single();
    if (!user) return res.json({ sonuc: 'hata' });
    const yeniBakiye = (parseFloat(user.bakiye)||0) + ekBakiye;
    const yeniToplam = (parseFloat(user.toplamalinan)||0) + (ekBakiye > 0 ? ekBakiye : 0);
    await supabase.from('kullanicilar').update({ bakiye:String(yeniBakiye), toplamalinan:String(yeniToplam), k_rol:fields.k_rol||user.k_rol }).eq('id', id);
    return res.json({ sonuc: 'tamam' });
  }

  // YURTICI KARGO
  if ('yurticiekle' in fields) {
    await supabase.from('yurtici').insert({ ...fields, ekleyen: session.kul_id });
    return res.json({ sonuc: 'tamam' });
  }

  return res.status(400).json({ sonuc: 'bilinmeyen_action' });
};
