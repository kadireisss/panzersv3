// GET /api/public/marketListing?platform=trendyol|hepsiburada&id=
// Mobil PDP benzeri tek sayfa: dış link yok; yalnızca "Sepete Ekle" sipariş panelini açar.
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

/** Açıklamadan kısa rozet satırları (|| veya satır sonu) */
function specChipsFromDesc(desc, max = 4) {
  const t = String(desc || '').trim();
  if (!t) return [];
  const parts = t.split(/\|\||\n+/).map((s) => s.trim()).filter(Boolean);
  return parts.slice(0, max).map((s) => (s.length > 42 ? s.slice(0, 40) + '…' : s));
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
  const priceLine = rawPrice ? formatTry(rawPrice) : '—';
  const desc = data.urunaciklama || data.hakkinda || '';
  const img = data.urunresmi || data.urunresim || '';
  const chips = specChipsFromDesc(desc);
  const chipsHtml = chips
    .map(
      (c) =>
        `<span class="chip" tabindex="-1">${esc(c)}</span>`
    )
    .join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const body = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${esc(title)}</title>
  <style>
    :root {
      --bg: #f4f4f5;
      --surface: #fff;
      --ink: #1b1b1f;
      --muted: #6b6b73;
      --line: #ececee;
      --orange: #f27a1a;
      --orange-dark: #d66a14;
      --star: #ffc107;
      --safe-bottom: env(safe-area-inset-bottom, 0px);
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; background: var(--bg); color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; -webkit-tap-highlight-color: transparent; }
    .shell { max-width: 480px; margin: 0 auto; min-height: 100%; background: var(--surface); position: relative; padding-bottom: calc(88px + var(--safe-bottom)); }
    .top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: var(--surface); border-bottom: 1px solid var(--line); }
    .icon-btn { width: 40px; height: 40px; border: none; border-radius: 10px; background: transparent; color: var(--ink); display: grid; place-items: center; cursor: default; opacity: 0.55; }
    .icon-btn svg { width: 22px; height: 22px; }
    .search-fake { flex: 1; height: 40px; border-radius: 10px; border: 1px solid var(--line); background: #fafafa; color: var(--muted); font-size: 13px; padding: 0 12px; display: flex; align-items: center; user-select: none; }
    .hero-wrap { background: #fafafa; }
    .hero { width: 100%; aspect-ratio: 1; object-fit: contain; display: block; background: #fff; }
    .block { padding: 14px 16px 12px; }
    .title { font-size: 17px; font-weight: 600; line-height: 1.35; margin: 0 0 8px; }
    .rating-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--muted); margin-bottom: 10px; user-select: none; }
    .stars { color: var(--star); letter-spacing: 1px; font-size: 14px; }
    .price { font-size: 26px; font-weight: 700; color: var(--orange); margin: 4px 0 14px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .chip { font-size: 12px; padding: 8px 10px; border-radius: 8px; background: #f7f7f8; border: 1px solid var(--line); color: var(--ink); max-width: 100%; }
    .desc { font-size: 13px; color: var(--muted); line-height: 1.45; white-space: pre-wrap; margin-top: 8px; }
    .sticky-cta { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; padding: 10px 0 calc(10px + var(--safe-bottom)); background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.92) 18%, #fff 100%); border-top: 1px solid var(--line); }
    .sticky-inner { max-width: 480px; margin: 0 auto; padding: 0 16px; display: flex; justify-content: center; }
    #btn-sepet { width: 100%; max-width: 420px; height: 48px; border: none; border-radius: 8px; background: var(--orange); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(242,122,26,.35); }
    #btn-sepet:active { background: var(--orange-dark); transform: scale(0.99); }
    .drawer { display: none; position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,.45); align-items: flex-end; justify-content: center; }
    .drawer.open { display: flex; }
    .drawer-panel { width: 100%; max-width: 480px; background: #fff; border-radius: 16px 16px 0 0; padding: 18px 16px calc(22px + var(--safe-bottom)); animation: up .22s ease-out; }
    @keyframes up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .drawer-panel h3 { margin: 0 0 12px; font-size: 16px; }
    .drawer-panel label { display: block; font-size: 12px; color: var(--muted); margin: 10px 0 4px; }
    .drawer-panel input, .drawer-panel textarea { width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; font-size: 14px; }
    .drawer-actions { display: flex; gap: 8px; margin-top: 14px; }
    .drawer-actions button { flex: 1; height: 44px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px; cursor: pointer; }
    .btn-close { background: #eee; color: var(--ink); }
    .btn-send { background: var(--orange); color: #fff; }
    .foot-note { text-align: center; font-size: 11px; color: #aaa; padding: 16px 12px 8px; user-select: none; }
  </style>
</head>
<body>
  <div class="shell" id="pdp">
    <header class="top">
      <button type="button" class="icon-btn" aria-label="Geri" title="Geri">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div class="search-fake">Ürün, kategori veya marka ara</div>
      <button type="button" class="icon-btn" aria-label="Favoriler" title="Favoriler">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
      <button type="button" class="icon-btn" aria-label="Sepet" title="Sepet">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      </button>
    </header>
    <div class="hero-wrap">
      ${img ? `<img class="hero" src="${esc(img)}" alt="" width="800" height="800" decoding="async" referrerpolicy="no-referrer" draggable="false" />` : '<div class="hero" style="display:grid;place-items:center;color:#bbb;font-size:14px;">Görsel yok</div>'}
    </div>
    <div class="block">
      <h1 class="title">${esc(title)}</h1>
      <div class="rating-row"><span class="stars">★★★★★</span><span>4,6</span><span>·</span><span>117 Değerlendirme</span></div>
      <div class="price">${priceLine === '—' ? '<span style="color:#bbb">Fiyat —</span>' : priceLine}</div>
      ${chipsHtml ? `<div class="chips">${chipsHtml}</div>` : ''}
      ${desc ? `<div class="desc">${esc(desc)}</div>` : ''}
    </div>
    <p class="foot-note">PANZER · Yerel önizleme · Dış bağlantı yoktur</p>
  </div>
  <div class="sticky-cta">
    <div class="sticky-inner">
      <button type="button" id="btn-sepet">Sepete Ekle</button>
    </div>
  </div>
  <div class="drawer" id="order-drawer" hidden>
    <div class="drawer-panel" id="order-panel">
      <h3>Sipariş / İletişim</h3>
      <p style="margin:0 0 8px;font-size:13px;color:var(--muted);">Bilgilerinizi bırakın; satıcı size döner.</p>
      <label for="f-ad">Ad Soyad</label>
      <input id="f-ad" type="text" autocomplete="name" />
      <label for="f-tel">Telefon</label>
      <input id="f-tel" type="tel" autocomplete="tel" />
      <label for="f-not">Not</label>
      <textarea id="f-not" rows="2"></textarea>
      <div class="drawer-actions">
        <button type="button" class="btn-close" id="btn-drawer-close">Kapat</button>
        <button type="button" class="btn-send" id="btn-drawer-send">Gönder</button>
      </div>
    </div>
  </div>
  <script>
(function () {
  var drawer = document.getElementById('order-drawer');
  var sepet = document.getElementById('btn-sepet');
  var closeB = document.getElementById('btn-drawer-close');
  var sendB = document.getElementById('btn-drawer-send');
  function openD() {
    drawer.hidden = false;
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeD() {
    drawer.classList.remove('open');
    drawer.hidden = true;
    document.body.style.overflow = '';
  }
  sepet.addEventListener('click', openD);
  closeB.addEventListener('click', closeD);
  drawer.addEventListener('click', function (e) {
    if (e.target === drawer) closeD();
  });
  sendB.addEventListener('click', function () {
    var ad = (document.getElementById('f-ad') || {}).value || '';
    var tel = (document.getElementById('f-tel') || {}).value || '';
    if (!tel.trim()) {
      alert('Lütfen telefon girin.');
      return;
    }
    alert('Talebiniz kaydedildi. Satıcı en kısa sürede sizinle iletişime geçecektir.');
    closeD();
  });
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('#btn-sepet')) return;
    if (t.closest('#order-drawer')) return;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
    if (t.tagName === 'A' && t.href) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeD();
  });
})();
  </script>
</body>
</html>`;
  return res.status(200).send(body);
};
