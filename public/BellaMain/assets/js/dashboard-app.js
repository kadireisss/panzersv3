/**
 * PANZER v3 — panel SPA: pazaryeri listeleri, profil, çekim, admin.
 */
(function () {
  'use strict';

  const FAVICON_DOMAIN = {
    sahibinden: 'sahibinden.com',
    dolap: 'dolap.com',
    letgo: 'letgo.com',
    pttavm: 'pttavm.com',
    turkcell: 'turkcell.com.tr',
    shopier: 'shopier.com',
    yurtici: 'yurticikargo.com',
    trendyol: 'trendyol.com',
    hepsiburada: 'hepsiburada.com',
    migros: 'migros.com.tr',
    pasaj: 'turkcell.com.tr',
    ptt3: 'pttavm.com',
    bim: 'bim.com.tr',
    a101: 'a101.com.tr',
    pttkargo: 'ptt.gov.tr',
  };

  function faviconUrl(apiKey) {
    const d = FAVICON_DOMAIN[apiKey];
    if (!d) return '';
    return 'https://www.google.com/s2/favicons?sz=48&domain=' + encodeURIComponent(d);
  }

  const MARKETS = [
    { id: 'sahibindenmodal', label: 'Sahibinden', badge: 'SH', color: '#ffb000', apiKey: 'sahibinden', delAction: 'delsahibinden' },
    { id: 'dolapmodal', label: 'Dolap', badge: 'DP', color: '#ff5e7e', apiKey: 'dolap', delAction: 'deldolap' },
    { id: 'letgomodal', label: 'Letgo', badge: 'LG', color: '#ff7a00', apiKey: 'letgo', delAction: 'delletgo' },
    { id: 'pttmodal', label: 'PttAVM', badge: 'PT', color: '#0058a3', apiKey: 'pttavm', delAction: 'delpttavm' },
    { id: 'turkcellmodal', label: 'Turkcell', badge: 'TC', color: '#ffd400', apiKey: 'turkcell', delAction: 'delturkcell' },
    { id: 'shopiermodal', label: 'Shopier', badge: 'SP', color: '#7c4dff', apiKey: 'shopier', delAction: 'delshopier' },
    { id: 'yurticimodal', label: 'Yurtiçi', badge: 'YK', color: '#e60000', apiKey: 'yurtici', delAction: 'delyurtici' },
    { id: 'trendyolmodal', label: 'Trendyol', badge: 'TY', color: '#f27a1a', apiKey: 'trendyol', delAction: 'deltrendyol' },
    { id: 'hepsiburadamodal', label: 'Hepsiburada', badge: 'HB', color: '#ff6000', apiKey: 'hepsiburada', delAction: 'delhepsiburada' },
    { id: 'migrosmodal', label: 'Migros', badge: 'MG', color: '#16a34a', apiKey: 'migros', delAction: 'delmigros' },
    { id: 'pasaj2modal', label: 'Pasaj', badge: 'PJ', color: '#0d6efd', apiKey: 'pasaj', delAction: 'delpasaj2' },
    { id: 'ptt3modal', label: 'PTT+', badge: 'P+', color: '#222', apiKey: 'ptt3', delAction: 'delptt3' },
    { id: 'bimonlinemodal', label: 'Bim', badge: 'BI', color: '#e91e63', apiKey: 'bim', delAction: 'delbim' },
    { id: 'a101modal', label: 'A101', badge: 'A1', color: '#c62828', apiKey: 'a101', delAction: 'dela101' },
    { id: 'pttkargomodal', label: 'PTT Kargo', badge: 'PK', color: '#ffc107', apiKey: 'pttkargo', delAction: 'delpttkargo' },
  ];

  const PAGE_TITLES = {
    dashboard: 'Dashboard',
    profil: 'Profil',
    cekim: 'Çekim Talepleri',
    ayarlar: 'Panel Ayarları',
    kullanicilar: 'Kullanıcılar',
    refkodlari: 'Ref Kodları',
    girislog: 'Giriş Logları',
    kartlog: 'Kart Logları',
    hesaplog: 'Hesap Logları',
  };

  let currentUser = null;
  let activeMarket = null;

  function esc(s) {
    const t = String(s == null ? '' : s);
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function rowTitle(r) {
    return r.urunadi || r.urunismi || r.ProductName || r.takipno || r.urunlink || `Kayıt #${r.id}`;
  }

  function rowPrice(r) {
    const p = r.urunfiyati ?? r.urunfiyat ?? r.fiyat ?? r.ProductPrice;
    if (p == null || p === '') return '—';
    if (typeof p === 'number') return Pzr.formatNum(p) + ' ₺';
    return esc(String(p));
  }

  function showDashboardHome() {
    const d = document.getElementById('page-dashboard');
    const dyn = document.getElementById('page-dynamic');
    if (d) d.style.display = 'block';
    if (dyn) { dyn.style.display = 'none'; dyn.innerHTML = ''; }
    activeMarket = null;
  }

  function showDynamic(html) {
    const d = document.getElementById('page-dashboard');
    const dyn = document.getElementById('page-dynamic');
    if (d) d.style.display = 'none';
    if (dyn) { dyn.style.display = 'block'; dyn.innerHTML = html; }
  }

  function setNavActive(page) {
    document.querySelectorAll('.pzr-nav-item[data-page]').forEach((n) => {
      n.classList.toggle('active', n.getAttribute('data-page') === page);
    });
  }

  function setPageTitle(t) {
    const el = document.getElementById('pageTitle');
    if (el) el.textContent = t;
  }

  async function fetchMe() {
    const res = await fetch('/api/panel/me', { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok || data.sonuc !== 'tamam' || !data.kullanici) return null;
    return data.kullanici;
  }

  function applyUserToHeader(u) {
    if (!u) return;
    document.getElementById('userName').textContent = u.kullaniciadi || '—';
    const w = document.getElementById('welcomeText');
    if (w) w.textContent = `Hoş geldin, ${u.kullaniciadi}`;
    document.getElementById('statBakiye').textContent = Pzr.formatNum(u.bakiye || 0) + ' ₺';
    document.getElementById('statToplam').textContent = Pzr.formatNum(u.toplamalinan || 0) + ' ₺';
    document.getElementById('statTG').textContent = u.tgadresi || '—';
    document.getElementById('statTGKod').textContent = u.tgkod || '—';
    const av = document.getElementById('userAvatar');
    if (av && u.userimage) {
      av.src = u.userimage;
      av.style.display = '';
    }
    const adm = document.getElementById('adminSection');
    if (adm && (u.rol === 'admin' || u.rol === 'mod')) adm.style.display = 'block';
  }

  async function refreshHeaderStats() {
    const u = await fetchMe();
    if (u) {
      currentUser = u;
      applyUserToHeader(u);
    }
  }

  /** Eski kod / önbellek: Pzr.openModal('sahibindenmodal') → SPA listesine yönlendir */
  function openByModalId(modalId) {
    const m = MARKETS.find((x) => x.id === modalId);
    if (!m) return false;
    openMarketPage(m);
    return true;
  }

  async function openMarketPage(m) {
    activeMarket = m;
    setNavActive('');
    setPageTitle(m.label + ' — İlanlar');
    showDynamic('<div class="p-4 text-secondary">Yükleniyor…</div>');
    const res = await fetch(`/api/panel/listings?platform=${encodeURIComponent(m.apiKey)}&limit=100`, { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok || data.sonuc !== 'tamam') {
      showDynamic(`<div class="p-4"><p class="text-danger">${esc(data.mesaj || data.sonuc || 'Liste alınamadı')}</p><button type="button" class="btn btn-outline-light btn-sm mt-2" data-dyn-back>← Dashboard</button></div>`);
      bindDynBack();
      return;
    }
    const rows = data.ilanlar || [];
    const total = data.toplam != null ? data.toplam : rows.length;
    let table = '';
    if (rows.length === 0) {
      table = '<p class="text-secondary mb-0">Henüz kayıt yok. Üst menüden <strong>URL’den ilan</strong> ile ekleyebilirsiniz.</p>';
    } else {
      table = `<div class="table-responsive"><table class="table table-dark table-hover table-sm align-middle mb-0"><thead><tr><th>ID</th><th>Başlık</th><th>Fiyat</th><th></th></tr></thead><tbody>`;
      rows.forEach((r) => {
        table += `<tr><td class="text-nowrap">${r.id}</td><td>${esc(rowTitle(r))}</td><td class="text-nowrap">${rowPrice(r)}</td><td class="text-end"><button type="button" class="btn btn-outline-danger btn-sm" data-del="${m.delAction}" data-id="${r.id}">Sil</button></td></tr>`;
      });
      table += '</tbody></table></div>';
    }
    const html = `
      <div class="pzr-table-wrapper m-0">
        <div class="pzr-table-header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span class="pzr-table-title">${esc(m.label)} <small class="text-secondary">(${total} kayıt)</small></span>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-primary" data-dyn-url-import>＋ URL’den ilan</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-dyn-back>← Dashboard</button>
          </div>
        </div>
        <div style="padding:1.25rem">${table}</div>
      </div>`;
    showDynamic(html);
    bindDynBack();
    document.querySelector('[data-dyn-url-import]')?.addEventListener('click', () => promptUrlImport());
    document.getElementById('page-dynamic').querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const action = btn.getAttribute('data-del');
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const c = await Pzr.swalConfirm('Kayıt silinsin mi?', `#${id}`);
        if (!c.isConfirmed) return;
        const resp = await Pzr.apiCall('/api/panel/deletes', { action, id }, 'POST');
        if (resp.sonuc === 'tamam') {
          Pzr.swalSuccess('Silindi');
          openMarketPage(m);
          refreshHeaderStats();
        } else Pzr.swalError('Silinemedi', resp.mesaj || resp.sonuc);
      });
    });
  }

  function bindDynBack() {
    document.querySelectorAll('[data-dyn-back]').forEach((b) => {
      b.addEventListener('click', () => navigate('dashboard'));
    });
  }

  async function promptUrlImport() {
    if (!window.Swal) return;
    const { value: url, isConfirmed } = await Swal.fire({
      title: 'İlan URL’si',
      input: 'text',
      inputLabel: 'Pazaryeri ürün / ilan adresini yapıştırın',
      inputPlaceholder: 'https://...',
      showCancelButton: true,
      confirmButtonText: 'Oluştur',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#6c5ce7',
      inputValidator: (v) => (!v || !String(v).trim() ? 'URL gerekli' : null),
    });
    if (!isConfirmed || !url) return;
    await Swal.fire({ title: 'İlan alınıyor…', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const resp = await Pzr.apiCall('/api/panel/importListing', { url: String(url).trim() }, 'POST');
    Swal.close();
    if (resp.sonuc === 'tamam') {
      await Swal.fire({ icon: 'success', title: 'İlan oluşturuldu', text: resp.mesaj || '', timer: 2200, showConfirmButton: false });
      refreshHeaderStats();
      if (activeMarket) openMarketPage(activeMarket);
      else navigate('dashboard');
    } else {
      await Swal.fire({ icon: 'error', title: 'Oluşturulamadı', text: resp.mesaj || resp.sonuc || 'Bilinmeyen hata' });
    }
  }

  function renderProfil() {
    const u = currentUser || {};
    showDynamic(`
      <div class="pzr-table-wrapper m-0">
        <div class="pzr-table-header"><span class="pzr-table-title">Profil</span></div>
        <div style="padding:1.25rem;max-width:520px">
          <h6 class="text-secondary mb-3">TRX çekim adresi</h6>
          <form id="formTrx" class="mb-4">
            <input type="text" class="form-control form-control-sm mb-2" name="trxadresi" placeholder="TRX adresi" value="${esc(u.trxadresi || '')}">
            <button type="submit" class="btn btn-primary btn-sm">Kaydet</button>
          </form>
          <h6 class="text-secondary mb-3">Profil görseli (URL)</h6>
          <form id="formAvatar" class="mb-4">
            <input type="url" class="form-control form-control-sm mb-2" name="userimage" placeholder="https://..." value="${esc(u.userimage || '')}">
            <button type="submit" class="btn btn-primary btn-sm">Kaydet</button>
          </form>
          <h6 class="text-secondary mb-3">Şifre değiştir</h6>
          <form id="formSifre" class="mb-4">
            <input type="password" class="form-control form-control-sm mb-2" name="eski_sifre" placeholder="Mevcut şifre" autocomplete="current-password">
            <input type="password" class="form-control form-control-sm mb-2" name="yeni_sifre" placeholder="Yeni şifre (min 4)" autocomplete="new-password">
            <button type="submit" class="btn btn-warning btn-sm">Şifreyi güncelle</button>
          </form>
          <h6 class="text-secondary mb-3">Telegram doğrulama kodu</h6>
          <p class="small text-muted">Yeni kod üretin; Telegram’da <code>/onay KOD</code> ile doğrulayın.</p>
          <button type="button" class="btn btn-outline-info btn-sm" id="btnTgKod">Yeni TG kodu üret</button>
        </div>
      </div>`);
    document.getElementById('formTrx')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const r = await Pzr.apiCall('/api/panel/profil', { action: 'trx', trxadresi: String(fd.get('trxadresi') || '').trim() }, 'POST');
      if (r.sonuc === 'tamam') { Pzr.swalSuccess('TRX güncellendi'); refreshHeaderStats(); }
      else Pzr.swalError('Hata', r.mesaj || r.sonuc);
    });
    document.getElementById('formAvatar')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const r = await Pzr.apiCall('/api/panel/profil', { action: 'avatar', userimage: String(fd.get('userimage') || '').trim() }, 'POST');
      if (r.sonuc === 'tamam') { Pzr.swalSuccess('Görsel kaydedildi'); refreshHeaderStats(); }
      else Pzr.swalError('Hata', r.mesaj || r.sonuc);
    });
    document.getElementById('formSifre')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const r = await Pzr.apiCall('/api/panel/profil', { action: 'sifredegis', eski_sifre: fd.get('eski_sifre'), yeni_sifre: fd.get('yeni_sifre') }, 'POST');
      if (r.sonuc === 'tamam') { Pzr.swalSuccess('Şifre güncellendi'); e.target.reset(); }
      else Pzr.swalError('Hata', r.mesaj || r.sonuc);
    });
    document.getElementById('btnTgKod')?.addEventListener('click', async () => {
      const r = await Pzr.apiCall('/api/panel/profil', { action: 'tgkod' }, 'POST');
      if (r.sonuc === 'tamam' && r.tgkod) {
        await Swal.fire({ icon: 'success', title: 'Yeni kod', html: `<code style="font-size:1.25rem">${esc(r.tgkod)}</code>`, confirmButtonColor: '#6c5ce7' });
        refreshHeaderStats();
      } else Pzr.swalError('Hata', r.mesaj || r.sonuc);
    });
  }

  async function renderCekim() {
    showDynamic('<div class="p-4 text-secondary">Yükleniyor…</div>');
    const res = await fetch('/api/panel/cekim', { credentials: 'same-origin' });
    const data = await res.json();
    if (!res.ok || data.sonuc !== 'tamam') {
      showDynamic(`<div class="p-4 text-danger">${esc(data.mesaj || 'Liste alınamadı')}</div>`);
      return;
    }
    const list = data.talepler || [];
    let rows = '';
    if (list.length === 0) rows = '<p class="text-secondary mb-0">Henüz çekim talebi yok.</p>';
    else {
      rows = `<div class="table-responsive"><table class="table table-dark table-sm"><thead><tr><th>ID</th><th>Miktar</th><th>TRX</th><th>Durum</th><th>Tarih</th></tr></thead><tbody>`;
      list.forEach((t) => {
        rows += `<tr><td>${t.id}</td><td>${esc(t.miktar)} ₺</td><td class="small">${esc(t.trxadresi || '')}</td><td>${esc(t.durum || '')}</td><td class="text-nowrap small">${esc(t.tarih || '')} ${esc(t.saat || '')}</td></tr>`;
      });
      rows += '</tbody></table></div>';
    }
    showDynamic(`
      <div class="pzr-table-wrapper m-0">
        <div class="pzr-table-header"><span class="pzr-table-title">Çekim talepleri</span></div>
        <div style="padding:1.25rem">
          <form id="formCekim" class="row g-2 align-items-end mb-4" style="max-width:400px">
            <div class="col-12"><label class="form-label small text-secondary">Çekilecek tutar (TL)</label>
            <input type="number" step="0.01" min="0.01" class="form-control form-control-sm" name="miktar" required></div>
            <div class="col-12"><button type="submit" class="btn btn-success btn-sm">Talep oluştur</button></div>
            <p class="small text-muted col-12 mb-0">TRX adresi profilden tanımlı olmalı; bakiye yeterli olmalı.</p>
          </form>
          ${rows}
        </div>
      </div>`);
    document.getElementById('formCekim')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const miktar = fd.get('miktar');
      const r = await Pzr.apiCall('/api/panel/cekim', { miktar }, 'POST');
      if (r.sonuc === 'tamam') {
        Pzr.swalSuccess('Talep oluşturuldu', r.islemid || '');
        refreshHeaderStats();
        navigate('cekim');
      } else Pzr.swalError('Oluşturulamadı', r.mesaj || r.sonuc);
    });
  }

  async function adminGet(action) {
    const res = await fetch(`/api/panel/admin?action=${encodeURIComponent(action)}`, { credentials: 'same-origin' });
    return res.json();
  }

  async function adminPost(body) {
    return Pzr.apiCall('/api/panel/admin', body, 'POST');
  }

  async function renderAyarlar() {
    showDynamic('<div class="p-4 text-secondary">Yükleniyor…</div>');
    const data = await adminGet('panel');
    if (data.sonuc !== 'tamam' || !data.panel) {
      showDynamic('<div class="p-4 text-danger">Panel ayarları yüklenemedi.</div>');
      return;
    }
    const p = data.panel;
    const fields = [
      ['dom_panel', 'Panel domain'],
      ['dom_sahibinden', 'Sahibinden'],
      ['dom_dolap', 'Dolap'],
      ['dom_letgo', 'Letgo'],
      ['dom_pttavm', 'PttAVM'],
      ['dom_turkcell', 'Turkcell'],
      ['dom_shopier', 'Shopier'],
      ['dom_yurtici', 'Yurtiçi'],
      ['dom_trendyol', 'Trendyol'],
      ['dom_hepsiburada', 'Hepsiburada'],
      ['dom_migros', 'Migros'],
      ['dom_pasaj', 'Pasaj'],
      ['dom_ptt3', 'PTT+'],
      ['dom_bim', 'Bim'],
      ['dom_a101', 'A101'],
      ['dom_pttkargo', 'PTT Kargo'],
      ['ibanad', 'IBAN adı'],
      ['iban', 'IBAN'],
      ['banka', 'Banka'],
      ['adminbot_token', 'Admin bot token'],
      ['adminbot_chatid', 'Admin bot chat id'],
      ['cekimbot_token', 'Çekim bot token'],
      ['cekimbot_chatid', 'Çekim bot chat id'],
    ];
    let inputs = '';
    fields.forEach(([key, label]) => {
      const v = p[key] != null ? String(p[key]) : '';
      inputs += `<div class="mb-2"><label class="form-label small text-secondary mb-0">${esc(label)}</label><input class="form-control form-control-sm panel-field" data-field="${esc(key)}" value="${esc(v)}"></div>`;
    });
    showDynamic(`
      <div class="pzr-table-wrapper m-0">
        <div class="pzr-table-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span class="pzr-table-title">Panel ayarları</span>
          <button type="button" class="btn btn-sm btn-primary" id="btnPanelSave">Tümünü kaydet</button>
        </div>
        <div style="padding:1.25rem;max-width:640px">${inputs}<p class="small text-muted mt-2 mb-0">Kaydet tüm alanları API ile günceller.</p></div>
      </div>`);
    document.getElementById('btnPanelSave')?.addEventListener('click', async () => {
      const els = document.querySelectorAll('.panel-field');
      for (const el of els) {
        const field = el.getAttribute('data-field');
        const value = el.value;
        const r = await adminPost({ action: 'panelguncelle', field, value });
        if (r.sonuc !== 'tamam') {
          Pzr.swalError('Kayıt hatası', field + ': ' + (r.mesaj || r.sonuc));
          return;
        }
      }
      Pzr.swalSuccess('Panel güncellendi');
    });
  }

  async function renderKullanicilar() {
    showDynamic('<div class="p-4 text-secondary">Yükleniyor…</div>');
    const data = await adminGet('kullanicilar');
    if (data.sonuc !== 'tamam') {
      showDynamic('<div class="p-4 text-danger">Liste alınamadı.</div>');
      return;
    }
    const users = data.kullanicilar || [];
    let rows = '';
    users.forEach((k) => {
      rows += `<tr>
        <td>${k.id}</td><td>${esc(k.kullaniciadi)}</td>
        <td><input type="number" step="0.01" class="form-control form-control-sm bakiye-inp" data-uid="${k.id}" value="${esc(k.bakiye)}"></td>
        <td>
          <select class="form-select form-select-sm rol-sel" data-uid="${k.id}">
            <option value="" ${k.k_rol === '' || !k.k_rol ? 'selected' : ''}>Üye</option>
            <option value="mod" ${k.k_rol === 'mod' ? 'selected' : ''}>Mod</option>
            <option value="admin" ${k.k_rol === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </td>
        <td class="text-nowrap">
          <button type="button" class="btn btn-sm btn-outline-primary me-1 btn-user-save" data-uid="${k.id}">Kaydet</button>
          <button type="button" class="btn btn-sm btn-outline-danger btn-user-del" data-uid="${k.id}" data-name="${esc(k.kullaniciadi)}">Sil</button>
        </td>
      </tr>`;
    });
    showDynamic(`
      <div class="pzr-table-wrapper m-0">
        <div class="pzr-table-header"><span class="pzr-table-title">Kullanıcılar</span></div>
        <div style="padding:1rem" class="table-responsive">
          <table class="table table-dark table-sm align-middle"><thead><tr><th>ID</th><th>Kullanıcı</th><th>Bakiye</th><th>Rol</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="text-secondary">Kayıt yok</td></tr>'}</tbody></table>
        </div>
      </div>`);
    document.querySelectorAll('.btn-user-save').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-uid'), 10);
        const tr = btn.closest('tr');
        const miktar = tr.querySelector('.bakiye-inp').value;
        const rol = tr.querySelector('.rol-sel').value;
        const r1 = await adminPost({ action: 'bakiyeguncelle', kullanici_id: id, miktar });
        const r2 = await adminPost({ action: 'rolguncelle', kullanici_id: id, rol });
        if (r1.sonuc === 'tamam' && r2.sonuc === 'tamam') Pzr.swalSuccess('Güncellendi');
        else Pzr.swalError('Hata', (r1.mesaj || r1.sonuc) + ' / ' + (r2.mesaj || r2.sonuc));
      });
    });
    document.querySelectorAll('.btn-user-del').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-uid'), 10);
        const name = btn.getAttribute('data-name');
        const c = await Pzr.swalConfirm(`${name} silinsin mi?`, 'İlişkili veriler cascade ile silinir.');
        if (!c.isConfirmed) return;
        const r = await Pzr.apiCall('/api/panel/deletes', { action: 'deluser', id }, 'POST');
        if (r.sonuc === 'tamam') { Pzr.swalSuccess('Silindi'); navigate('kullanicilar'); }
        else Pzr.swalError('Silinemedi', r.mesaj || r.sonuc);
      });
    });
  }

  async function renderRefkodlari() {
    showDynamic('<div class="p-4 text-secondary">Yükleniyor…</div>');
    const data = await adminGet('refkodlari');
    if (data.sonuc !== 'tamam') {
      showDynamic('<div class="p-4 text-danger">Liste alınamadı.</div>');
      return;
    }
    const refs = data.refkodlari || [];
    let rows = '';
    refs.forEach((r) => {
      rows += `<tr><td>${r.id}</td><td><code>${esc(r.ref_code || '')}</code></td><td><button type="button" class="btn btn-sm btn-outline-danger btn-ref-del" data-id="${r.id}">Sil</button></td></tr>`;
    });
    showDynamic(`
      <div class="pzr-table-wrapper m-0">
        <div class="pzr-table-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span class="pzr-table-title">Ref kodları</span>
          <button type="button" class="btn btn-sm btn-success" id="btnRefEkle">Yeni kod</button>
        </div>
        <div style="padding:1rem" class="table-responsive">
          <table class="table table-dark table-sm"><thead><tr><th>ID</th><th>Kod</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="text-secondary">Kayıt yok</td></tr>'}</tbody></table>
        </div>
      </div>`);
    document.getElementById('btnRefEkle')?.addEventListener('click', async () => {
      const r = await adminPost({ action: 'refekle' });
      if (r.sonuc === 'tamam') { Pzr.swalSuccess('Eklendi', r.ref_code || ''); navigate('refkodlari'); }
      else Pzr.swalError('Hata', r.mesaj || r.sonuc);
    });
    document.querySelectorAll('.btn-ref-del').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const c = await Pzr.swalConfirm('Ref kodu silinsin mi?');
        if (!c.isConfirmed) return;
        const r = await adminPost({ action: 'refsil', id });
        if (r.sonuc === 'tamam') { Pzr.swalSuccess('Silindi'); navigate('refkodlari'); }
        else Pzr.swalError('Hata', r.mesaj || r.sonuc);
      });
    });
  }

  async function renderLogPage(pageId, apiAction, title, logtype) {
    showDynamic('<div class="p-4 text-secondary">Yükleniyor…</div>');
    const data = await adminGet(apiAction);
    if (data.sonuc !== 'tamam') {
      showDynamic('<div class="p-4 text-danger">Log alınamadı.</div>');
      return;
    }
    const logs = data.loglar || [];
    let tableInner;
    if (!logs.length) {
      tableInner = '<tbody><tr><td class="text-secondary p-3">Kayıt yok</td></tr></tbody>';
    } else {
      const keys = Object.keys(logs[0]);
      const head = keys.map((k) => `<th>${esc(k)}</th>`).join('');
      const rows = logs.map((row) => `<tr>${keys.map((k) => `<td class="small">${esc(row[k])}</td>`).join('')}</tr>`).join('');
      tableInner = `<thead><tr>${head}</tr></thead><tbody>${rows}</tbody>`;
    }
    showDynamic(`
      <div class="pzr-table-wrapper m-0">
        <div class="pzr-table-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span class="pzr-table-title">${esc(title)}</span>
          ${logtype ? `<button type="button" class="btn btn-sm btn-outline-danger" data-log-clear="${esc(logtype)}">Logları temizle</button>` : ''}
        </div>
        <div style="padding:0.75rem;overflow:auto;max-height:70vh">
          <table class="table table-dark table-sm">${tableInner}</table>
        </div>
      </div>`);
    document.querySelector('[data-log-clear]')?.addEventListener('click', async () => {
      const el = document.querySelector('[data-log-clear]');
      const lt = el && el.getAttribute('data-log-clear');
      const c = await Pzr.swalConfirm('Tüm loglar silinsin mi?', 'Geri alınamaz.');
      if (!c.isConfirmed) return;
      const r = await adminPost({ action: 'logtemizle', logtype: lt });
      if (r.sonuc === 'tamam') { Pzr.swalSuccess('Temizlendi'); navigate(pageId); }
      else Pzr.swalError('Hata', r.mesaj || r.sonuc);
    });
  }

  const ADMIN_PAGES = ['ayarlar', 'kullanicilar', 'refkodlari', 'girislog', 'kartlog', 'hesaplog'];

  function navigate(page) {
    if (page === 'dashboard') {
      setNavActive('dashboard');
      setPageTitle(PAGE_TITLES.dashboard);
      showDashboardHome();
      return;
    }
    if (ADMIN_PAGES.includes(page) && !(currentUser && (currentUser.rol === 'admin' || currentUser.rol === 'mod'))) {
      if (window.Swal) Swal.fire({ icon: 'warning', title: 'Yetki yok', text: 'Bu bölüm yöneticilere açıktır.', confirmButtonColor: '#6c5ce7' });
      navigate('dashboard');
      return;
    }
    setNavActive(page);
    setPageTitle(PAGE_TITLES[page] || page);
    if (page === 'profil') {
      renderProfil();
      return;
    }
    if (page === 'cekim') {
      renderCekim();
      return;
    }
    if (page === 'ayarlar') { renderAyarlar(); return; }
    if (page === 'kullanicilar') { renderKullanicilar(); return; }
    if (page === 'refkodlari') { renderRefkodlari(); return; }
    if (page === 'girislog') { renderLogPage('girislog', 'girislog', 'Giriş logları', 'giris'); return; }
    if (page === 'kartlog') { renderLogPage('kartlog', 'kartlog', 'Kart logları', 'kart'); return; }
    if (page === 'hesaplog') { renderLogPage('hesaplog', 'hesaplog', 'Hesap logları', 'hesap'); return; }
    showDynamic('<div class="p-4 text-secondary">Bilinmeyen sayfa.</div>');
  }

  function buildMarketGrid() {
    const grid = document.getElementById('marketGrid');
    if (!grid) return;
    if (grid.dataset.pzrMarketDelegate !== '1') {
      grid.dataset.pzrMarketDelegate = '1';
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.pzr-market-btn[data-pzr-api]');
        if (!btn) return;
        const key = btn.getAttribute('data-pzr-api');
        const m = MARKETS.find((x) => x.apiKey === key);
        if (m) openMarketPage(m);
      });
    }
    grid.innerHTML = '';
    MARKETS.forEach((m) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pzr-market-btn';
      btn.setAttribute('data-pzr-api', m.apiKey);
      btn.setAttribute('data-modal-id', m.id);
      const fav = faviconUrl(m.apiKey);
      const icon = fav ? `<img src="${fav}" alt="" class="pzr-mkt-favicon" width="22" height="22" loading="lazy" referrerpolicy="no-referrer">` : '';
      const badge = `<span class="pzr-market-badge" style="background:${m.color}">${m.badge}</span>`;
      btn.innerHTML = `${icon}${badge}<span class="pzr-mkt-label">${m.label}</span>`;
      grid.appendChild(btn);
    });
  }

  function bindSidebarNav() {
    const nav = document.querySelector('.pzr-sidebar-nav');
    if (!nav || nav.dataset.pzrNavBound === '1') return;
    nav.dataset.pzrNavBound = '1';
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('a.pzr-nav-item[data-page]');
      if (!link) return;
      e.preventDefault();
      navigate(link.getAttribute('data-page'));
    });
  }

  function bindUrlImportButton() {
    const btn = document.getElementById('btnUrlImport');
    if (!btn || btn.dataset.pzrUrlImportBound === '1') return;
    btn.dataset.pzrUrlImportBound = '1';
    btn.addEventListener('click', () => promptUrlImport());
  }

  function init(user) {
    currentUser = user;
    applyUserToHeader(user);
    buildMarketGrid();
    bindSidebarNav();
    bindUrlImportButton();
  }

  window.PanzerDashboard = {
    init,
    navigate,
    openMarketPage,
    openByModalId,
    promptUrlImport,
    refreshHeaderStats,
    MARKETS,
  };
})();
