// api/lib/telegram.js — Telegram Bot API wrapper
const BASE = 'https://api.telegram.org/bot';

async function tgFetch(token, method, body = {}) {
  const res = await fetch(`${BASE}${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res.json();
}

async function sendMessage(token, chatId, text, extra = {}) { return tgFetch(token, 'sendMessage', { chat_id: chatId, text, ...extra }); }
async function setWebhook(token, url) { return tgFetch(token, 'setWebhook', { url }); }
async function deleteWebhook(token) { return tgFetch(token, 'deleteWebhook'); }
async function getChat(token, chatId) { const r = await tgFetch(token, 'getChat', { chat_id: chatId }); return r?.result || null; }
async function answerCallbackQuery(token, callbackQueryId, text = '') { return tgFetch(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId, text }); }
async function editMessageReplyMarkup(token, chatId, messageId, replyMarkup = { inline_keyboard: [] }) { return tgFetch(token, 'editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: JSON.stringify(replyMarkup) }); }

module.exports = { sendMessage, setWebhook, deleteWebhook, getChat, answerCallbackQuery, editMessageReplyMarkup };
