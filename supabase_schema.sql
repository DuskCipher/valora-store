-- ========================================================
-- SQL Script untuk Membuat Fitur Notifikasi & Chat Real-time
-- Silakan salin dan jalankan script ini di SQL Editor Supabase Anda.
-- ========================================================

-- 1. Tabel Notifikasi
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'order', 'payment', 'system', 'chat')),
  is_read BOOLEAN DEFAULT false NOT NULL,
  target_url TEXT,
  scope TEXT DEFAULT 'user' NOT NULL CHECK (scope IN ('user', 'shop')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS untuk Tabel Notifikasi
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users (simulasi notif)"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2. Tabel Ruang Chat
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (buyer_id, store_id)
);

-- RLS untuk Tabel Ruang Chat
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat rooms as buyer"
  ON public.chat_rooms FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "Stores can view their own chat rooms as seller"
  ON public.chat_rooms FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE public.stores.id = store_id
      AND public.stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can insert chat rooms"
  ON public.chat_rooms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- 3. Tabel Pesan Chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS untuk Tabel Pesan Chat
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their rooms"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE public.chat_rooms.id = room_id
      AND (
        public.chat_rooms.buyer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.stores
          WHERE public.stores.id = public.chat_rooms.store_id
          AND public.stores.owner_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert messages in their rooms"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE public.chat_rooms.id = room_id
      AND (
        public.chat_rooms.buyer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.stores
          WHERE public.stores.id = public.chat_rooms.store_id
          AND public.stores.owner_id = auth.uid()
        )
      )
    )
  );

-- 4. Trigger Pembaruan Waktu Obrolan
CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_rooms
  SET updated_at = now()
  where id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_chat_message ON public.chat_messages;
CREATE TRIGGER on_new_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_chat_message();

-- 5. Aktifkan Supabase Realtime untuk tabel-tabel di atas
-- Note: Beberapa database/Supabase project membutuhkan perintah ini agar real-time bekerja.
-- Jika sudah aktif otomatis di dashboard, bagian ini opsional.
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;

-- 6. Tambahkan kolom is_hidden ke tabel banners (untuk fitur Hide Banner)
-- Jalankan perintah ini jika tabel banners sudah ada:
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
