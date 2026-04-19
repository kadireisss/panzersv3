// Ortam değişkenlerinden Supabase URL + service role (sadece sunucu)
function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();
}

function getServiceRoleKey() {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
}

module.exports = { getSupabaseUrl, getServiceRoleKey };
