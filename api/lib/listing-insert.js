// Pazaryeri ilanı — tablo eşlemesi ve insert (bookmarklet + URL import ortak)
const TABLE_MAP = {
  sahibinden: 'ilan_sahibinden',
  dolap: 'ilan_dolap',
  letgo: 'ilan_letgo',
  pttavm: 'ilan_pttavm',
  turkcell: 'ilan_turkcell',
  shopier: 'ilan_shopier',
  trendyol: 'ty_ilan',
  hepsiburada: 'hb_urun',
  migros: 'bella_mg_urunler',
  pasaj: 'bella_pj_urunler',
  bim: 'bella_bim_products',
  a101: 'bella_a101_products',
};

function buildInsertRow(platform, { title, price, description, images, url }) {
  const insertData = {};
  const imgs = images || [];
  const t = (title || '').trim() || 'İsimsiz ilan';
  const rawP = price != null && price !== '' ? String(price).trim() : '';
  const p = rawP.toLowerCase() === 'null' ? '' : rawP;
  const d = description != null ? String(description) : '';
  const u = url != null ? String(url) : '';

  switch (platform) {
    case 'sahibinden':
      Object.assign(insertData, {
        urunadi: t,
        urunfiyati: p,
        aciklama: d,
        resim1: imgs[0] || '',
        resim2: imgs[1] || '',
        resim3: imgs[2] || '',
        resim4: imgs[3] || '',
        resim5: imgs[4] || '',
      });
      break;
    case 'dolap':
    case 'letgo':
      Object.assign(insertData, {
        urunadi: t,
        urunfiyati: p,
        aciklama: d,
        resim1: imgs[0] || '',
        resim2: imgs[1] || '',
        resim3: imgs[2] || '',
        resim4: imgs[3] || '',
        resim5: imgs[4] || '',
        resim6: imgs[5] || '',
      });
      break;
    case 'trendyol':
      Object.assign(insertData, {
        urunadi: t,
        urunfiyat: p,
        urunaciklama: d,
        urunresmi: imgs[0] || '',
        kaynak_url: u,
      });
      break;
    case 'hepsiburada':
      Object.assign(insertData, { urunadi: t, urunfiyat: p, urunresim: imgs[0] || '', urunlink: u });
      break;
    case 'migros':
      Object.assign(insertData, {
        urunismi: t,
        fiyat: p,
        hakkinda: d,
        urunlink: u,
        resim1: imgs[0] || '',
        resim2: imgs[1] || '',
        resim3: imgs[2] || '',
      });
      break;
    case 'pasaj':
      Object.assign(insertData, {
        urunismi: t,
        fiyat: p,
        hakkinda: d,
        urunlink: u,
        resim1: imgs[0] || '',
        resim2: imgs[1] || '',
        resim3: imgs[2] || '',
      });
      break;
    case 'bim':
      Object.assign(insertData, {
        ProductName: t,
        ProductPrice: parseInt(String(p).replace(/\D/g, ''), 10) || 0,
        ImageURL: imgs[0] || '',
        ProductSefURL: u,
      });
      break;
    case 'a101':
      Object.assign(insertData, {
        ProductName: t,
        ProductPrice: parseInt(String(p).replace(/\D/g, ''), 10) || 0,
        ImageURL: imgs[0] || '',
        Image2URL: imgs[1] || '',
        ProductSefURL: u,
      });
      break;
    default:
      Object.assign(insertData, {
        urunadi: t,
        urunfiyati: p,
        aciklama: d,
        resim1: imgs[0] || '',
        resim2: imgs[1] || '',
      });
  }
  return insertData;
}

async function insertMarketplaceListing(supabase, platform, fields, ekleyen) {
  const table = TABLE_MAP[platform];
  if (!table) throw new Error(`Desteklenmeyen platform: ${platform}`);
  const row = { ekleyen, ...buildInsertRow(platform, fields) };
  return supabase.from(table).insert(row);
}

module.exports = { TABLE_MAP, buildInsertRow, insertMarketplaceListing };
