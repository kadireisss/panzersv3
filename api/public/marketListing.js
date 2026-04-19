// GET /api/public/marketListing?platform=trendyol|hepsiburada&id= — panelde kayıtlı ürünün HTML önizlemesi
const { supabase } = require('../lib/supabase');

const TABLES = {
  trendyol: 'ty_ilan',
  hepsiburada: 'hb_urun',
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTry(val) {
  const str = String(val == null ? '' : val).trim();
  if (!str) return '';
  const n = parseFloat(str.replace(/[^\d.-]/g, ''));
  if (!Number.isNaN(n) && /^\d+([.,]\d+)?$/.test(str.replace(/\s/g, ''))) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(n);
  }
  return esc(str);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const platform = String(req.query.platform || '').toLowerCase();
  const id = parseInt(String(req.query.id || ''), 10);
  const table = TABLES[platform];
  if (!table || !id) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send('<!DOCTYPE html><html lang="tr"><meta charset="utf-8"><title>Hata</title><body><p>Geçersiz istek.</p></body></html>');
  }

  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error || !data) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send('<!DOCTYPE html><html lang="tr"><meta charset="utf-8"><title>Bulunamadı</title><body><p>İlan bulunamadı.</p></body></html>');
  }
  if (data.ilandurum != null && String(data.ilandurum) === '0') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send('<!DOCTYPE html><html lang="tr"><meta charset="utf-8"><title>Kapalı</title><body><p>İlan yayından kaldırılmış.</p></body></html>');
  }

  const title = data.urunadi || 'Ürün';
  const rawPrice = data.urunfiyat ?? data.urunfiyati ?? data.fiyat ?? '';
  const priceLine = rawPrice ? formatTry(rawPrice) : '';
  const desc = data.urunaciklama || data.hakkinda || '';
  const img = data.urunresmi || data.urunresim || '';
  const sourceUrl = String(data.kaynak_url || data.urunlink || '').trim();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  const body = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} — PANZER</title>
  <style>
    :root { color-scheme: dark; --bg:#0f0f12; --card:#1a1a20; --accent:#e63946; --text:#eee; --muted:#9aa0a6; }
    body { margin:0; font-family: system-ui, sans-serif; background:var(--bg); color:var(--text); line-height:1.5; }
    .wrap { max-width:720px; margin:0 auto; padding:1.5rem; }
    .card { background:var(--card); border-radius:14px; padding:1.25rem; border:1px solid rgba(255,255,255,.08); }
    h1 { font-size:1.35rem; margin:0 0 .75rem; font-weight:600; }
    .price { font-size:1.5rem; font-weight:700; color:var(--accent); margin:.5rem 0 1rem; }
    img.hero { width:100%; max-height:420px; object-fit:contain; border-radius:10px; background:#000; }
    .desc { color:var(--muted); font-size:.95rem; white-space:pre-wrap; }
    .actions { margin-top:1.25rem; display:flex; flex-wrap:wrap; gap:.5rem; }
    a.btn { display:inline-block; padding:.55rem 1rem; border-radius:8px; text-decoration:none; font-size:.9rem; }
    a.primary { background:var(--accent); color:#fff; }
    a.secondary { border:1px solid rgba(255,255,255,.2); color:var(--text); }
    footer { margin-top:2rem; font-size:.75rem; color:var(--muted); text-align:center; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      ${img ? `<img class="hero" src="${esc(img)}" alt="" loading="lazy" />` : ''}
      <h1>${esc(title)}</h1>
      ${priceLine ? `<p class="price">${priceLine}</p>` : '<p class="price" style="opacity:.6">Fiyat —</p>'}
      ${desc ? `<div class="desc">${esc(desc)}</div>` : ''}
      <div class="actions">
        ${sourceUrl ? `<a class="btn primary" href="${esc(sourceUrl)}" rel="noopener noreferrer" target="_blank">Orijinal ürün sayfası</a>` : ''}
        <a class="btn secondary" href="/dashboard">Panele dön</a>
      </div>
    </div>
    <footer>PANZER v3 — önizleme sayfası</footer>
  </div>
</body>
</html>`;
  return res.status(200).send(body);
};
