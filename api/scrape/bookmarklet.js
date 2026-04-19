// api/scrape/bookmarklet.js — Bookmarklet'ten gelen veriyi DB'ye kaydet
const { supabase } = require('../lib/supabase');
const { requireAuth } = require('../lib/auth');
const { getJsonBody } = require('../lib/json-body');
const { insertMarketplaceListing } = require('../lib/listing-insert');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const session = requireAuth(req, res);
  if (!session) return;

  const body = getJsonBody(req);
  const { platform, title, price, description, images, url } = body;
  if (!platform || !title) return res.status(400).json({ sonuc: 'hata', mesaj: 'Platform ve başlık zorunludur.' });

  try {
    const { error } = await insertMarketplaceListing(
      supabase,
      platform,
      { title, price, description, images, url },
      session.kul_id
    );
    if (error) throw error;
    return res.status(200).json({ sonuc: 'tamam', mesaj: `${platform} ilanı kaydedildi.` });
  } catch (err) {
    console.error('[Bookmarklet]', err);
    return res.status(500).json({ sonuc: 'hata', mesaj: err.message });
  }
};
