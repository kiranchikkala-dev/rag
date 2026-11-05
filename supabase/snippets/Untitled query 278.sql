CREATE POLICY "Temporary anonymous uploads to sources"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'sources'
);