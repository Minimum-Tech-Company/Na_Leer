-- Storage policies for logos bucket
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own logos
CREATE POLICY "Users can update logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own logos
CREATE POLICY "Users can delete logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access to logos
CREATE POLICY "Public read logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');
