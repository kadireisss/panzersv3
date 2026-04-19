// api/lib/upload.js — Supabase Storage wrapper
const { supabase } = require('./supabase');
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'panzer-uploads';
const ALLOWED_EXTS = ['jpg','jpeg','png','gif','webp'];

async function uploadImage(fileBuffer, originalName, mimetype, subfolder = '') {
  const ext = originalName.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) throw new Error(`İzin verilmeyen dosya uzantısı: ${ext}`);
  const uniqueName = `${subfolder ? subfolder + '/' : ''}${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(uniqueName, fileBuffer, { contentType: mimetype, upsert: false });
  if (error) throw new Error(`Upload hatası: ${error.message}`);
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(uniqueName);
  return publicUrl;
}

async function deleteImage(fileUrl) {
  if (!fileUrl) return;
  try { const urlObj = new URL(fileUrl); const parts = urlObj.pathname.split(`/storage/v1/object/public/${BUCKET}/`); const filePath = parts[1] || fileUrl.split('/').pop(); await supabase.storage.from(BUCKET).remove([filePath]); } catch {}
}

async function deleteImages(urls = []) {
  const paths = [];
  for (const url of urls) { if (!url) continue; try { const urlObj = new URL(url); const parts = urlObj.pathname.split(`/storage/v1/object/public/${BUCKET}/`); paths.push(parts[1] || url.split('/').pop()); } catch {} }
  if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths);
}

module.exports = { uploadImage, deleteImage, deleteImages, BUCKET };
