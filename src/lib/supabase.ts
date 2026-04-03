import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createMissingSupabaseClient() {
  return new Proxy({} as ReturnType<typeof createClient>, {
    get() {
      throw new Error('Configurazione Supabase mancante: verifica NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.');
    },
  });
}

// Client-side (anon key)
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : createMissingSupabaseClient();

// Server-side (service role — bypasses RLS for admin operations)
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : createMissingSupabaseClient();

export const STORAGE_BUCKET = 'documents';

export async function uploadDocument(
  file: File,
  path: string,
): Promise<{ url: string; error: Error | null }> {
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (error) return { url: '', error: new Error(error.message) };

  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, error: null };
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
