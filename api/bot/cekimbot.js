// api/bot/cekimbot.js — Çekim Onay/Red Telegram Bot Webhook
const { supabase } = require('../lib/supabase');
const { sendMessage, answerCallbackQuery, editMessageReplyMarkup } = require('../lib/telegram');

const AUTHORIZED_USER_IDS = [5606327063, 6594066326];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { data: panel } = await supabase.from('panel').select('cekimbot_token,cekimbot_chatid').eq('id', 1).single();
  const token = panel?.cekimbot_token || process.env.CEKIM_BOT_TOKEN;

  const cb = body?.callback_query;
  if (cb) {
    const fromId = cb.from?.id;
    if (!AUTHORIZED_USER_IDS.includes(fromId)) { await answerCallbackQuery(token, cb.id, '❌ Bu işlem için yetkiniz yok.'); return res.status(200).end(); }
    const data = cb.data || '';
    const chatId = cb.message?.chat?.id;
    const messageId = cb.message?.message_id;

    if (data.startsWith('approve_')) {
      const uniqueId = data.replace('approve_', '');
      const { data: cbRec } = await supabase.from('cekim_callbacks').select('*').eq('unique_id', uniqueId).single();
      if (!cbRec) { await answerCallbackQuery(token, cb.id, '⚠️ Kayıt bulunamadı.'); return res.status(200).end(); }
      await supabase.from('cekimtalepleri').update({ durum: 'Tamamlandı' }).eq('islemid', cbRec.islemid);
      await supabase.from('cekim_callbacks').delete().eq('unique_id', uniqueId);
      await editMessageReplyMarkup(token, chatId, messageId);
      await answerCallbackQuery(token, cb.id, '✅ Çekim onaylandı!');
      await sendMessage(token, chatId, `✅ *ONAYLANDI* — İşlem ID: ${cbRec.islemid}\n👤 ${cbRec.ekleyen} | 💰 ${cbRec.miktar} TL`, { parse_mode: 'Markdown' });
    }

    if (data.startsWith('reject_')) {
      const uniqueId = data.replace('reject_', '');
      const { data: cbRec } = await supabase.from('cekim_callbacks').select('*').eq('unique_id', uniqueId).single();
      if (!cbRec) { await answerCallbackQuery(token, cb.id, '⚠️ Kayıt bulunamadı.'); return res.status(200).end(); }
      await supabase.from('cekimtalepleri').update({ durum: 'Reddedildi' }).eq('islemid', cbRec.islemid);
      const { data: user } = await supabase.from('kullanicilar').select('bakiye').eq('kullaniciadi', cbRec.ekleyen).single();
      if (user) { const yeniBakiye = (parseFloat(user.bakiye)||0) + parseFloat(cbRec.miktar||0); await supabase.from('kullanicilar').update({ bakiye: String(yeniBakiye) }).eq('kullaniciadi', cbRec.ekleyen); }
      await supabase.from('cekim_callbacks').delete().eq('unique_id', uniqueId);
      await editMessageReplyMarkup(token, chatId, messageId);
      await answerCallbackQuery(token, cb.id, '❌ Çekim reddedildi.');
      await sendMessage(token, chatId, `❌ *REDDEDİLDİ* — İşlem ID: ${cbRec.islemid}\n👤 ${cbRec.ekleyen} | 💰 ${cbRec.miktar} TL iade edildi.`, { parse_mode: 'Markdown' });
    }
    return res.status(200).end();
  }
  res.status(200).end();
};
