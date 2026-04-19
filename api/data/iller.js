// api/data/iller.js — İl/İlçe JSON API
const { supabase } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { action, il } = req.query;
  try {
    if (action === 'il') {
      const { data, error } = await supabase.from('ilceler').select('il').order('il', { ascending: true });
      if (error) throw error;
      const iller = [...new Set(data.map((r) => r.il))].sort();
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.json(iller);
    }
    if (action === 'ilce' && il) {
      const { data, error } = await supabase.from('ilceler').select('ilce').eq('il', il).order('ilce', { ascending: true });
      if (error) throw error;
      const ilceler = [...new Set(data.map((r) => r.ilce))].sort();
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.json(ilceler);
    }
    return res.status(400).json({ hata: 'Geçersiz action. Kullanım: ?action=il veya ?action=ilce&il=Adana' });
  } catch (err) {
    return res.status(500).json({ hata: err.message });
  }
};
