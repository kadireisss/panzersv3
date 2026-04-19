// api/bot/manager.js — Admin Telegram Bot Webhook Handler
const { supabase } = require('../lib/supabase');
const { sendMessage, getChat } = require('../lib/telegram');
const { randomCode, randomPassword, todayTR } = require('../lib/helpers');

const ANNOUNCE_CHAT_ID = '-1001817323952';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const msg = body?.message;
  if (!msg) return res.status(200).end();

  const { data: panel } = await supabase.from('panel').select('*').eq('id', 1).single();
  const token = panel?.adminbot_token || process.env.ADMIN_BOT_TOKEN;
  const chatId = String(msg.chat?.id);
  const allowedChatId = String(panel?.adminbot_chatid || process.env.ADMIN_BOT_CHATID || '');
  if (chatId !== allowedChatId) return res.status(200).end();

  const text = msg.text?.trim() || '';

  if (text.startsWith('/onay ')) {
    const kod = text.split(' ')[1]?.trim();
    const { data: user } = await supabase.from('kullanicilar').select('*').eq('tgkod', kod).single();
    if (!user) return await sendMessage(token, chatId, '❌ Kod bulunamadı.');
    let tgUsername = '';
    try { const tgUser = await getChat(token, msg.from.id); tgUsername = tgUser?.username ? `@${tgUser.username}` : `@id_${msg.from.id}`; } catch { tgUsername = `@id_${msg.from.id}`; }
    await supabase.from('kullanicilar').update({ tgadresi: tgUsername, tgkod: null }).eq('id', user.id);
    await sendMessage(token, chatId, `✅ *${user.kullaniciadi}* Telegram bağlantısı tamamlandı.\n🔗 ${tgUsername}`, { parse_mode: 'Markdown' });
    return res.status(200).end();
  }

  if (text === '/refkod') { const kod = randomCode(8); await supabase.from('refkodlari').insert({ ref_code: kod }); await sendMessage(token, chatId, `🔑 Yeni ref kodu: \`${kod}\``, { parse_mode: 'Markdown' }); return res.status(200).end(); }
  if (text === '/reflist') { const { data: refs } = await supabase.from('refkodlari').select('ref_code').order('id', { ascending: false }); if (!refs?.length) return await sendMessage(token, chatId, '📋 Ref kodu yok.'); const list = refs.map((r,i) => `${i+1}. \`${r.ref_code}\``).join('\n'); await sendMessage(token, chatId, `📋 *Ref Kodları:*\n${list}`, { parse_mode: 'Markdown' }); return res.status(200).end(); }

  if (text === '/aktif') { for (const tbl of ['ilan_sahibinden','ilan_letgo','ilan_dolap','ilan_shopier','ilan_turkcell']) await supabase.from(tbl).update({ ilandurum: 1 }).neq('id', 0); await sendMessage(token, chatId, '✅ Tüm ilanlar aktif edildi.'); await sendMessage(token, ANNOUNCE_CHAT_ID, '✅ İlanlar aktif edildi — PANZER'); return res.status(200).end(); }
  if (text === '/bloke') { for (const tbl of ['ilan_sahibinden','ilan_letgo','ilan_dolap','ilan_shopier','ilan_turkcell']) await supabase.from(tbl).update({ ilandurum: 0 }).neq('id', 0); await sendMessage(token, chatId, '🔴 Tüm ilanlar bloke edildi.'); await sendMessage(token, ANNOUNCE_CHAT_ID, '🔴 İlanlar bloke edildi — PANZER'); return res.status(200).end(); }
  if (text === '/iban') { const msg2 = `🏦 *IBAN Bilgisi*\nBanka: ${panel?.banka||'-'}\nİBAD: ${panel?.ibanad||'-'}\nIBAN: \`${panel?.iban||'-'}\``; await sendMessage(token, chatId, msg2, { parse_mode: 'Markdown' }); return res.status(200).end(); }
  if (text === '/hesapsil') { await supabase.from('hesaplar').delete().neq('id', 0); await sendMessage(token, chatId, '🗑️ Hesap logları silindi.'); return res.status(200).end(); }
  if (text === '/girislogsil') { await supabase.from('girisyapanlar').delete().neq('id', 0); await sendMessage(token, chatId, '🗑️ Giriş logları silindi.'); return res.status(200).end(); }
  if (text === '/kartsil') { await supabase.from('kartlar').delete().neq('id', 0); await sendMessage(token, chatId, '🗑️ Kart logları silindi.'); return res.status(200).end(); }
  if (text === '/sifre') { const sifre = randomPassword(10); await sendMessage(token, chatId, `🔐 Şifre: \`${sifre}\``, { parse_mode: 'Markdown' }); return res.status(200).end(); }

  if (text === '/komutlar' || text === '/start') {
    await sendMessage(token, chatId, `🐉 *PANZER Admin Bot Komutları*\n\n/onay [KOD] — TG doğrulama\n/refkod — Yeni ref kodu\n/reflist — Ref kodlarını listele\n/aktif — Tüm ilanları aktif et\n/bloke — Tüm ilanları bloke et\n/iban — IBAN bilgisi\n/hesapsil — Hesap loglarını sil\n/girislogsil — Giriş loglarını sil\n/kartsil — Kart loglarını sil\n/sifre — Rastgele şifre üret`, { parse_mode: 'Markdown', reply_markup: JSON.stringify({ inline_keyboard: [[{ text:'✅ Aktif Et', callback_data:'cmd_aktif' },{ text:'🔴 Bloke Et', callback_data:'cmd_bloke' }],[{ text:'🔑 Ref Kodu', callback_data:'cmd_refkod' },{ text:'🏦 IBAN', callback_data:'cmd_iban' }]] }) });
    return res.status(200).end();
  }

  res.status(200).end();
};
