// api/bot/setup-webhooks.js — Telegram webhook kurulumu
const { supabase } = require('../lib/supabase');
const { setWebhook } = require('../lib/telegram');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const setupSecret = process.env.WEBHOOK_SETUP_SECRET || 'panzer-setup-2024';
  if (req.query.secret !== setupSecret) return res.status(403).json({ error: 'Unauthorized' });

  const { data: panel } = await supabase.from('panel').select('*').eq('id', 1).single();
  if (!panel) return res.status(500).json({ error: 'Panel row not found' });

  const baseUrl = `https://${req.headers.host}`;
  const results = [];
  if (panel.adminbot_token) { const r = await setWebhook(panel.adminbot_token, `${baseUrl}/api/bot/manager`); results.push({ bot:'admin', result:r }); }
  if (panel.cekimbot_token) { const r = await setWebhook(panel.cekimbot_token, `${baseUrl}/api/bot/cekimbot`); results.push({ bot:'cekim', result:r }); }
  if (panel.dekontbot_token) results.push({ bot:'dekont', result:'Token mevcut, handler ayarlanacak' });
  if (panel.vergibot_token) results.push({ bot:'vergi', result:'Token mevcut, handler ayarlanacak' });

  return res.status(200).json({ sonuc:'tamam', mesaj:'Webhook kurulumu tamamlandı.', baseUrl, webhooks: results });
};
