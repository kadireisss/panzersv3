// iller.js — İl/İlçe cascading dropdown helper
(function () {
  'use strict';
  const API_BASE = '/api/data/iller';

  async function loadIller(selectId) {
    const sel = document.getElementById(selectId); if (!sel) return;
    sel.innerHTML = '<option value="">İl Seçiniz...</option>';
    try {
      const res = await fetch(`${API_BASE}?action=il`); const iller = await res.json();
      iller.forEach((il) => { const opt = document.createElement('option'); opt.value = il; opt.textContent = il; sel.appendChild(opt); });
      if (window.jQuery && jQuery.fn.select2) jQuery(`#${selectId}`).select2({ theme: 'bootstrap-5', width: '100%', placeholder: 'İl Seçiniz...' });
    } catch (e) { console.error('[PANZER] İller yüklenemedi:', e); }
  }

  async function loadIlceler(ilSelectId, ilceSelectId) {
    const ilSel = document.getElementById(ilSelectId); const ilceSel = document.getElementById(ilceSelectId);
    if (!ilSel || !ilceSel) return;
    const il = ilSel.value; ilceSel.innerHTML = '<option value="">İlçe Seçiniz...</option>';
    if (!il) return;
    try {
      const res = await fetch(`${API_BASE}?action=ilce&il=${encodeURIComponent(il)}`); const ilceler = await res.json();
      ilceler.forEach((ilce) => { const opt = document.createElement('option'); opt.value = ilce; opt.textContent = ilce; ilceSel.appendChild(opt); });
      if (window.jQuery && jQuery.fn.select2) jQuery(`#${ilceSelectId}`).select2({ theme: 'bootstrap-5', width: '100%', placeholder: 'İlçe Seçiniz...' });
    } catch (e) { console.error('[PANZER] İlçeler yüklenemedi:', e); }
  }

  function bindIlIlce(ilSelectId, ilceSelectId) {
    const ilSel = document.getElementById(ilSelectId); if (!ilSel) return;
    ilSel.addEventListener('change', () => loadIlceler(ilSelectId, ilceSelectId));
    if (window.jQuery) jQuery(`#${ilSelectId}`).on('change', () => loadIlceler(ilSelectId, ilceSelectId));
  }

  window.PzrIller = { loadIller, loadIlceler, bindIlIlce };
})();
