// api/auth/logout.js — Çıkış endpoint'i
const { clearAuthCookie } = require('../lib/auth');
module.exports = async function handler(req, res) { clearAuthCookie(res); return res.json({ sonuc: 'tamam' }); };
