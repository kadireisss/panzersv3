-- Trendyol (ve diğer) ilanlar için orijinal ürün linki — public önizleme / yönlendirme
ALTER TABLE public.ty_ilan ADD COLUMN IF NOT EXISTS kaynak_url VARCHAR(800);
