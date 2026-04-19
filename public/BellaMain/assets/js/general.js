// general.js — PANZER genel yardımcı fonksiyonlar (frontend)

(function () {
  'use strict';

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { document._originalTitle = document.title; document.title = 'Bizi unutma :)'; }
    else { document.title = document._originalTitle || 'PANZER'; }
  });

  async function apiCall(url, data = {}, method = 'POST') {
    try {
      const opts = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' };
      if (method !== 'GET') opts.body = JSON.stringify(data);
      const res = await fetch(url, opts);
      return await res.json();
    } catch (e) { console.error('[PANZER] API hatası:', e); return { sonuc: 'hata', mesaj: e.message }; }
  }

  async function apiUpload(url, formEl) {
    try { const fd = new FormData(formEl); const res = await fetch(url, { method: 'POST', credentials: 'same-origin', body: fd }); return await res.json(); }
    catch (e) { console.error('[PANZER] Upload hatası:', e); return { sonuc: 'hata', mesaj: e.message }; }
  }

  function swalSuccess(title = 'Başarılı!', text = '') { if (window.Swal) return Swal.fire({ icon: 'success', title, text, timer: 2000, showConfirmButton: false }); }
  function swalError(title = 'Hata!', text = '') { if (window.Swal) return Swal.fire({ icon: 'error', title, text }); }
  function swalConfirm(title = 'Emin misiniz?', text = 'Bu işlem geri alınamaz.') {
    if (window.Swal) return Swal.fire({ title, text, icon: 'warning', showCancelButton: true, confirmButtonColor: '#6c5ce7', cancelButtonColor: '#ff6b6b', confirmButtonText: 'Evet', cancelButtonText: 'İptal' });
    return Promise.resolve({ isConfirmed: confirm(title + '\n' + text) });
  }

  function openModal(id) { const o = document.getElementById(id); if (o) o.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeModal(id) { const o = document.getElementById(id); if (o) o.classList.remove('active'); document.body.style.overflow = ''; }

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('pzr-modal-overlay')) { e.target.classList.remove('active'); document.body.style.overflow = ''; }
    if (e.target.classList.contains('pzr-modal-close')) { const o = e.target.closest('.pzr-modal-overlay'); if (o) { o.classList.remove('active'); document.body.style.overflow = ''; } }
  });

  function toggleSidebar() { document.querySelector('.pzr-sidebar')?.classList.toggle('open'); document.querySelector('.pzr-sidebar-overlay')?.classList.toggle('active'); }

  async function handleDelete(action, id, label = 'Bu kaydı') {
    const result = await swalConfirm(`${label} silmek istediğinize emin misiniz?`);
    if (!result.isConfirmed) return;
    const resp = await apiCall('/api/panel/deletes', { action, id });
    if (resp.sonuc === 'tamam') { swalSuccess('Silindi!'); setTimeout(() => location.reload(), 1200); }
    else { swalError('Silinemedi', resp.mesaj || resp.sonuc); }
  }

  function getCookie(name) { const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)'); return v ? decodeURIComponent(v.pop()) : null; }
  function decodeJWT(token) { try { const p = token.split('.')[1]; return JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))); } catch { return null; } }
  function getSessionInfo() { const t = getCookie('auth_token'); if (!t) return null; return decodeJWT(t); }
  function formatDate(str) { if (!str) return '-'; try { const d = new Date(str); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`; } catch { return str; } }

  function previewImage(input, previewEl) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => { const img = typeof previewEl === 'string' ? document.querySelector(previewEl) : previewEl; if (img) { if (img.tagName === 'IMG') img.src = e.target.result; else img.style.backgroundImage = `url(${e.target.result})`; } };
      reader.readAsDataURL(input.files[0]);
    }
  }

  function formatNum(n) { return Number(n || 0).toLocaleString('tr-TR'); }

  window.Pzr = { apiCall, apiUpload, swalSuccess, swalError, swalConfirm, openModal, closeModal, toggleSidebar, handleDelete, getCookie, decodeJWT, getSessionInfo, formatDate, previewImage, formatNum };
})();
