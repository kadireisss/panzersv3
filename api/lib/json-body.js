/**
 * Vercel / Node serverless: req.body bazen string, bazen obje, bazen boş gelir.
 */
function getJsonBody(req) {
  const b = req.body;
  if (b == null || b === '') return {};
  if (typeof b === 'string') {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(b)) {
    try {
      return JSON.parse(b.toString('utf8') || '{}');
    } catch {
      return {};
    }
  }
  if (typeof b === 'object') return b;
  return {};
}

module.exports = { getJsonBody };
