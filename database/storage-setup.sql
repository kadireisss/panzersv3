-- Storage: Dashboard → Storage → yeni bucket → adı .env içindeki SUPABASE_STORAGE_BUCKET ile aynı (örn. panzer-uploads)
-- Bucket "Public" olarak işaretlenebilir veya aşağıdaki politikalarla okuma açılır.

-- INSERT INTO storage.buckets (id, name, public) VALUES ('panzer-uploads', 'panzer-uploads', true)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY IF NOT EXISTS yok; ilk kurulumda Dashboard'dan policy eklemek genelde daha kolaydır.
-- Örnek: herkese public okuma (sadece güvenilir içerik için)
-- CREATE POLICY "Public read panzer-uploads"
-- ON storage.objects FOR SELECT TO public
-- USING (bucket_id = 'panzer-uploads');
