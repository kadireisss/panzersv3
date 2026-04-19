/**
 * İlan URL → platform + HTML'den başlık/fiyat/görsel (og + JSON-LD, basit regex).
 * Bazı siteler sunucu IP'sini engelleyebilir; bookmarklet veya importListing ile gönderilen html yedek akıştır.
 *
 * IMPORT_LISTING_FETCH_DELEGATE (isteğe bağlı): Kendi HTTPS endpoint'inize POST { url } gönderilir;
 * yanıt JSON { html } veya düz HTML. IMPORT_LISTING_FETCH_DELEGATE_SECRET varsa Authorization: Bearer … eklenir.
 * Yasal uyum ve hedef site koşulları kullanıcıya aittir.
 */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function metaByProperty(html, prop) {
  const esc = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]*property=["']${esc}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${esc}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) return decodeEntities(m[1].trim());
  }
  return '';
}

function metaByName(html, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<meta[^>]*name=["']${esc}["'][^>]*content=["']([^"']*)["']`, 'i');
  const m = html.match(re);
  return m && m[1] ? decodeEntities(m[1].trim()) : '';
}

function allOgImages(html) {
  const out = [];
  const re = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const u = decodeEntities(m[1].trim());
    if (u && !out.includes(u)) out.push(u);
  }
  const re2 = /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/gi;
  while ((m = re2.exec(html)) !== null) {
    const u = decodeEntities(m[1].trim());
    if (u && !out.includes(u)) out.push(u);
  }
  return out;
}

function titleFromHtml(html) {
  let t =
    metaByProperty(html, 'og:title') ||
    metaByName(html, 'twitter:title') ||
    metaByProperty(html, 'twitter:title');
  if (t) return t.replace(/\s*\|\s*.*$/, '').trim();
  const m = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i);
  return m ? decodeEntities(m[1].trim().replace(/\s*\|\s*.*$/, '')) : '';
}

function tryJsonLdProduct(html) {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let j;
    try {
      j = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const nodes = Array.isArray(j) ? j : [j];
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const types = node['@type'];
      const tlist = Array.isArray(types) ? types : types ? [types] : [];
      const isProduct = tlist.includes('Product') || node.name;
      if (!isProduct && !node.productID) continue;
      const name = node.name || node.headline || '';
      let price = '';
      const off = node.offers;
      if (typeof off === 'object' && off) {
        price = String(off.price ?? off.lowPrice ?? off.highPrice ?? '');
      }
      let images = [];
      if (node.image) {
        images = Array.isArray(node.image) ? node.image : [node.image];
        images = images.map((x) => (typeof x === 'string' ? x : x?.url)).filter(Boolean);
      }
      return { title: name, price, description: node.description || '', images };
    }
  }
  return null;
}

function detectPlatformFromUrl(raw) {
  let u;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const h = u.hostname.replace(/^www\./i, '').toLowerCase();
  const path = u.pathname.toLowerCase();

  if (h.includes('sahibinden.com')) return 'sahibinden';
  if (h.includes('dolap.com')) return 'dolap';
  if (h.includes('letgo.com')) return 'letgo';
  if (h.includes('pttavm.com') || h.includes('epttavm.com')) return 'pttavm';
  if (h.includes('turkcell.com.tr') || h.includes('pasaj.turkcell')) return 'turkcell';
  if (h.includes('shopier.com')) return 'shopier';
  if (h.includes('trendyol.com')) return 'trendyol';
  if (h.includes('hepsiburada.com')) return 'hepsiburada';
  if (h.includes('migros.com.tr')) {
    if (path.includes('/pasaj') || path.includes('pasaj-')) return 'pasaj';
    return 'migros';
  }
  if (h.includes('bim.com.tr') || h.includes('bimsonline.com')) return 'bim';
  if (h.includes('a101.com.tr')) return 'a101';
  return null;
}

function bodyBufferWithTimeout(res, ms) {
  return Promise.race([
    res.arrayBuffer(),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Sayfa gövdesi okuma zaman aşımı')), ms)),
  ]);
}

const FETCH_HEAD_MS = 14000;
const BODY_READ_MS = 12000;
const HTML_MAX_BYTES = 2_500_000;

function parseListingFromHtml(htmlRaw) {
  let html = typeof htmlRaw === 'string' ? htmlRaw : '';
  if (html.charCodeAt(0) === 0xfeff) html = html.slice(1);

  const ld = tryJsonLdProduct(html);
  const title = (ld?.title || titleFromHtml(html) || '').trim();
  const description =
    ld?.description ||
    metaByProperty(html, 'og:description') ||
    metaByName(html, 'description') ||
    '';
  let price = ld?.price || '';
  if (!price) {
    price =
      metaByProperty(html, 'product:price:amount') ||
      metaByProperty(html, 'og:price:amount') ||
      metaByProperty(html, 'twitter:data1') ||
      '';
  }
  let images = ld?.images?.length ? ld.images : allOgImages(html);
  if (!images.length) {
    const one = metaByProperty(html, 'og:image');
    if (one) images = [one];
  }
  images = images.filter(Boolean).slice(0, 8);

  return { title, price, description, images };
}

async function fetchListingHtml(url) {
  const delegate = (process.env.IMPORT_LISTING_FETCH_DELEGATE || '').trim();
  if (delegate) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/html;q=0.9,*/*;q=0.8',
    };
    const secret = (process.env.IMPORT_LISTING_FETCH_DELEGATE_SECRET || '').trim();
    if (secret) headers.Authorization = `Bearer ${secret}`;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_HEAD_MS);
    let res;
    try {
      res = await fetch(delegate, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url }),
        signal: ctrl.signal,
        redirect: 'follow',
      });
    } finally {
      clearTimeout(t);
    }
    if (!res.ok) throw new Error(`Delegasyon HTTP ${res.status}`);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) {
      const j = await res.json();
      if (j && typeof j.html === 'string' && j.html.length) return j.html;
      throw new Error('Delegasyon: yanıtta html alanı yok veya boş');
    }
    let buf;
    try {
      buf = await bodyBufferWithTimeout(res, BODY_READ_MS);
    } catch (e) {
      if (e && e.name === 'AbortError') throw new Error('Bağlantı zaman aşımı');
      throw e;
    }
    const slice = buf.byteLength > HTML_MAX_BYTES ? buf.slice(0, HTML_MAX_BYTES) : buf;
    return Buffer.from(slice).toString('utf8');
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_HEAD_MS);
  let res;
  try {
    res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });
  } finally {
    clearTimeout(t);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  let buf;
  try {
    buf = await bodyBufferWithTimeout(res, BODY_READ_MS);
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('Bağlantı zaman aşımı');
    throw e;
  }
  const slice = buf.byteLength > HTML_MAX_BYTES ? buf.slice(0, HTML_MAX_BYTES) : buf;
  return Buffer.from(slice).toString('utf8');
}

/** @param {string} url @param {{ html?: string }} [opts] */
async function fetchAndParseListing(url, opts = {}) {
  let html;
  if (opts.html != null && String(opts.html).trim()) {
    html = String(opts.html);
    if (Buffer.byteLength(html, 'utf8') > HTML_MAX_BYTES) {
      html = Buffer.from(html, 'utf8').subarray(0, HTML_MAX_BYTES).toString('utf8');
    }
  } else {
    html = await fetchListingHtml(url);
  }
  return parseListingFromHtml(html);
}

module.exports = {
  detectPlatformFromUrl,
  fetchAndParseListing,
  fetchListingHtml,
  parseListingFromHtml,
  decodeEntities,
};
