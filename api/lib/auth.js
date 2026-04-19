// api/lib/auth.js — JWT + sifreleWadanz/sifrecozWadanz + cookie helpers
const zlib = require('zlib');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookie = require('cookie');

const COOKIE_NAME = '2tUgyO@H9E!4CuQ';
const JWT_SECRET = process.env.JWT_SECRET || 'panzer-dev-secret';

function sifreleWadanz(obj) { const str=String(obj); const serialized=`s:${Buffer.byteLength(str)}:"${str}";`; return zlib.deflateSync(Buffer.from(serialized)).toString('base64'); }
function sifrecozWadanz(txt) { try { const buf=Buffer.from(txt,'base64'); const d=zlib.inflateSync(buf).toString(); const m=d.match(/s:\d+:"(.*)";/); return m?m[1]:null; } catch { return null; } }
function signToken(payload) { return jwt.sign(payload, JWT_SECRET, { expiresIn: '365d' }); }
function verifyToken(token) { return jwt.verify(token, JWT_SECRET); }

function setAuthCookie(res, username, role) {
  const token = signToken({ kul_id: username, is_rol: role });
  const legacyCookie = sifreleWadanz(username + '+1');
  res.setHeader('Set-Cookie', [
    cookie.serialize('auth_token', token, { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax', maxAge:365*24*60*60, path:'/' }),
    cookie.serialize(COOKIE_NAME, legacyCookie, { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax', maxAge:365*24*60*60, path:'/' }),
  ]);
}

function clearAuthCookie(res) { res.setHeader('Set-Cookie', [cookie.serialize('auth_token','',{maxAge:0,path:'/'}), cookie.serialize(COOKIE_NAME,'',{maxAge:0,path:'/'})]); }
function getSession(req) { const cookies=cookie.parse(req.headers.cookie||''); if (!cookies.auth_token) return null; try { return verifyToken(cookies.auth_token); } catch { return null; } }
function requireAuth(req, res) { const s=getSession(req); if (!s) { res.status(401).json({ sonuc:'yetkisiz' }); return null; } return s; }
function isAdmin(session) { return session?.is_rol==='admin'; }
function isModOrAdmin(session) { return ['admin','mod'].includes(session?.is_rol); }
function canTouchRecord(session, recordOwner) { if (!session) return false; if (isAdmin(session)) return true; return session.kul_id===recordOwner; }

module.exports = { sifreleWadanz, sifrecozWadanz, signToken, verifyToken, setAuthCookie, clearAuthCookie, getSession, requireAuth, isAdmin, isModOrAdmin, canTouchRecord, COOKIE_NAME };
