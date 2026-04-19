// api/lib/helpers.js — Ortak yardımcı fonksiyonlar
const crypto = require('crypto');

function randomCode(len = 8) { return crypto.randomBytes(len).toString('hex').slice(0, len).toUpperCase(); }
function randomId(len = 12) { return crypto.randomBytes(len).toString('hex').slice(0, len); }
function randomPassword(len = 10) { const chars='ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'; let r=''; for (let i=0;i<len;i++) r+=chars[Math.floor(Math.random()*chars.length)]; return r; }

function todayTR() { return new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }); }
function nowTimeTR() { return new Date().toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' }); }

function isAllowedImage(filename) { const ext=filename.split('.').pop()?.toLowerCase(); return ['jpg','jpeg','png','gif','webp'].includes(ext); }
function createSlug(text) { return text.toLowerCase().replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function formatMoney(val) { const n=parseFloat(val)||0; return n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' TL'; }

module.exports = { randomCode, randomId, randomPassword, todayTR, nowTimeTR, isAllowedImage, createSlug, formatMoney };
