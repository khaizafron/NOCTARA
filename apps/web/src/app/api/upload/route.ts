import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const BUCKET = 'noctara-uploads';

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `uploads/${randomUUID()}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      // Bucket might not exist yet -- try to create it
      if (
        uploadError.message?.includes('not found') ||
        uploadError.message?.includes('does not exist')
      ) {
        const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
          public: false,
          fileSizeLimit: MAX_SIZE,
        });
        if (bucketError && !bucketError.message?.includes('already exists')) {
          throw new Error(`Cannot create bucket: ${bucketError.message}`);
        }
        // Retry upload
        const { error: retryError } = await supabase.storage
          .from(BUCKET)
          .upload(path, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          });
        if (retryError) throw new Error(retryError.message);
      } else {
        throw new Error(uploadError.message);
      }
    }

    // Create a signed URL valid for 7 days so agents can read the file
    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    if (signError || !signedData) {
      throw new Error(`Failed to create signed URL: ${signError?.message}`);
    }

    return NextResponse.json({
      url: signedData.signedUrl,
      path,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}