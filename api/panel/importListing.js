// POST /api/panel/importListing — JSON { url, html? } — ilan URL'sinden otomatik kayıt (html opsiyonel: tarayıcı kaynağı)
const { supabase } = require('../lib/supabase');
const { requireAuth } = require('../lib/auth');
const { getJsonBody } = require('../lib/json-body');
const { detectPlatformFromUrl, fetchAndParseListing } = require('../lib/marketplace-fetch');
const { insertMarketplaceListing } = require('../lib/listing-insert');

const IMPORT_MAX_MS = 26000;

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ sonuc: 'method_not_allowed' });
    const session = requireAuth(req, res);
    if (!session) return;

    const body = getJsonBody(req);
    const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
    if (!rawUrl) return res.status(400).json({ sonuc: 'hata', mesaj: 'url alanı gerekli.' });

    let pastedHtml =
      typeof body.html === 'string' && body.html.trim() ? String(body.html) : '';
    if (pastedHtml && Buffer.byteLength(pastedHtml, 'utf8') > 2_500_000) {
      pastedHtml = Buffer.from(pastedHtml, 'utf8').subarray(0, 2_500_000).toString('utf8');
    }

    let normalized;
    try {
      normalized = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`).href;
    } catch {
      return res.json({ sonuc: 'hata', mesaj: 'Geçersiz URL.' });
    }

    const platform = detectPlatformFromUrl(normalized);
    if (!platform) {
      return res.json({
        sonuc: 'hata',
        mesaj:
          'Bu alan adı tanınmıyor. Desteklenenler: Sahibinden, Dolap, Letgo, PttAVM, Turkcell Pasaj, Shopier, Trendyol, Hepsiburada, Migros, Bim, A101.',
      });
    }

    let parsed;
    try {
      parsed = await Promise.race([
        fetchAndParseListing(normalized, pastedHtml ? { html: pastedHtml } : {}),
        new Promise((_, rej) => setTimeout(() => rej(new Error('İçe aktarma zaman aşımı')), IMPORT_MAX_MS)),
      ]);
    } catch (e) {
      return res.json({
        sonuc: 'hata',
        mesaj:
          `Sayfa indirilemedi: ${e.message}. Site bot trafiğini kesiyor olabilir; tarayıcı bookmarklet veya manuel giriş deneyin.`,
        platform,
      });
    }

    if (!parsed.title) {
      return res.json({
        sonuc: 'hata',
        mesaj:
          'Sayfadan başlık alınamadı (meta/JSON-LD yok veya engel). İçeriği tarayıcıdan paylaşmayı deneyin.',
        platform,
      });
    }

    const { error } = await insertMarketplaceListing(
      supabase,
      platform,
      {
        title: parsed.title,
        price: parsed.price,
        description: parsed.description,
        images: parsed.images,
        url: normalized,
      },
      session.kul_id
    );

    if (error) {
      console.error('[importListing]', error);
      return res.status(500).json({ sonuc: 'hata', mesaj: error.message || 'Veritabanı hatası', platform });
    }

    return res.json({
      sonuc: 'tamam',
      mesaj: `${platform} ilanı oluşturuldu.`,
      platform,
      baslik: parsed.title,
    });
  } catch (e) {
    console.error('[importListing]', e);
    return res.status(500).json({ sonuc: 'hata', mesaj: String(e.message || e) });
  }
};
