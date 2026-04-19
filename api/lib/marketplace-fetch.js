/**
 * İlan URL → platform + HTML'den başlık/fiyat/görsel (og + JSON-LD, basit regex).
 * Bazı siteler sunucu IP'sini engelleyebilir; bu durumda bookmarklet yedek akıştır.
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

function jsonLdRoots(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed['@graph'])) return parsed['@graph'];
  return [parsed];
}

function extractLdPrice(offers) {
  if (!offers) return '';
  const pickOne = (o) => {
    if (!o || typeof o !== 'object') return '';
    const v = o.price ?? o.lowPrice ?? o.highPrice;
    if (v != null && String(v).trim() !== '') return String(v).trim();
    return '';
  };
  if (Array.isArray(offers)) {
    for (const o of offers) {
      const p = pickOne(o);
      if (p) return p;
    }
    return '';
  }
  return pickOne(offers);
}

/** schema.org ImageObject: contentUrl / url, string veya dizi */
function extractLdImages(imageField) {
  if (!imageField) return [];
  if (typeof imageField === 'string') return [imageField];
  if (Array.isArray(imageField)) return imageField.flatMap((x) => extractLdImages(x));
  if (typeof imageField === 'object') {
    const o = imageField;
    if (typeof o.url === 'string') return [o.url];
    if (Array.isArray(o.url)) return o.url.filter(Boolean);
    if (typeof o.contentUrl === 'string') return [o.contentUrl];
    if (Array.isArray(o.contentUrl)) return o.contentUrl.filter(Boolean);
  }
  return [];
}

function ldProductScore(c) {
  let s = 0;
  if (c.title) s += 2;
  if (c.price) s += 5;
  if (c.images?.length) s += Math.min(c.images.length, 4);
  if (c.description) s += 1;
  return s;
}

/**
 * Yalnızca @type Product (veya yakın türler) — WebPage'in `name` alanı Product sanılmasın (Trendyol vb.).
 */
function tryJsonLdProduct(html) {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  let best = null;
  let bestScore = -1;
  while ((m = re.exec(html)) !== null) {
    let j;
    try {
      j = JSON.parse(m[1].trim());
    } catch {
      continue;
    }
    const nodes = jsonLdRoots(j);
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const types = node['@type'];
      const tlist = Array.isArray(types) ? types : types ? [types] : [];
      const isProduct =
        tlist.includes('Product') ||
        tlist.includes('IndividualProduct') ||
        tlist.includes('ProductModel');
      if (!isProduct) continue;
      const name = (node.name || node.headline || '').trim();
      const price = extractLdPrice(node.offers);
      const images = extractLdImages(node.image).filter(Boolean);
      const candidate = {
        title: name,
        price,
        description: typeof node.description === 'string' ? node.description : '',
        images,
      };
      const sc = ldProductScore(candidate);
      if (sc > bestScore) {
        best = candidate;
        bestScore = sc;
      }
    }
  }
  return best;
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

async function fetchAndParseListing(url) {
  const ctrl = new AbortController();
  const FETCH_HEAD_MS = 14000;
  const BODY_READ_MS = 12000;
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
  const max = 2_500_000;
  const slice = buf.byteLength > max ? buf.slice(0, max) : buf;
  let html = Buffer.from(slice).toString('utf8');
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

module.exports = { detectPlatformFromUrl, fetchAndParseListing, decodeEntities, tryJsonLdProduct };
