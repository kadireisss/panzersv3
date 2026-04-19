// api/panel/cekim.js — v3 cekim API (v3 from original)
const { supabase } = require('../lib/supabase');
const { requireAuth } = require('../lib/auth');
const { sendMessage } = require('../lib/telegram');
const { randomCode, todayTR, nowTimeTR } = require('../lib/helpers');

module.exports = async function handler(req, res) {
  const user = requireAuth(req, res);
  if (!user) return;
  if (req.method === 'GET') {
    let query = supabase.from('cekimtalepleri').select('*').order('id', { ascending: false });
    if (user.is_rol !== 'admin' && user.is_rol !== 'mod') query = query.eq('ekleyen', user.kul_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ sonuc:'hata', mesaj:error.message });
    return res.json({ sonuc:'tamam', talepler: data || [] });
  }
  if (req.method !== 'POST') return res.status(405).end();
  const { miktar } = req.body;
  const miktarNum = parseFloat(miktar);
  if (!miktarNum || miktarNum <= 0) return res.status(400).json({ sonuc:'hata', mesaj:'Geçersiz miktar.' });
  const { data: userData } = await supabase.from('kullanicilar').select('bakiye, trxadresi').eq('kullaniciadi', user.kul_id).single();
  const bakiye = parseFloat(userData?.bakiye || 0);
  if (miktarNum > bakiye) return res.status(400).json({ sonuc:'hata', mesaj:'Yetersiz bakiye.' });
  const trxAdresi = userData?.trxadresi || '';
  if (!trxAdresi) return res.status(400).json({ sonuc:'hata', mesaj:'TRX adresi tanımlı değil.' });
  const islemId = 'CKM-' + randomCode(8);
  const uniqueId = randomCode(16);
  await supabase.from('kullanicilar').update({ bakiye: String(bakiye - miktarNum) }).eq('kullaniciadi', user.kul_id);
  await supabase.from('cekimtalepleri').insert({ miktar:String(miktarNum), trxadresi:trxAdresi, durum:'Beklemede', tarih:todayTR(), saat:nowTimeTR(), islemid:islemId, ekleyen:user.kul_id });
  await supabase.from('cekim_callbacks').insert({ unique_id:uniqueId, islemid:islemId, ekleyen:user.kul_id, miktar:String(miktarNum) });
  const { data: panel } = await supabase.from('panel').select('cekimbot_token,cekimbot_chatid').eq('id', 1).single();
  const token = panel?.cekimbot_token || process.env.CEKIM_BOT_TOKEN;
  const chatId = panel?.cekimbot_chatid || process.env.CEKIM_BOT_CHATID;
  if (token && chatId) {
    const msg = `💰 *Yeni Çekim Talebi*\n\n👤 ${user.kul_id}\n💵 ${miktarNum} TL\n🏦 \`${trxAdresi}\`\n🆔 ${islemId}\n📅 ${todayTR()} ${nowTimeTR()}`;
    await sendMessage(token, chatId, msg, { parse_mode:'Markdown', reply_markup:JSON.stringify({ inline_keyboard:[[{ text:'✅ Onayla', callback_data:`approve_${uniqueId}` },{ text:'❌ Reddet', callback_data:`reject_${uniqueId}` }]] }) });
  }
  return res.json({ sonuc:'tamam', islemid:islemId });
};
