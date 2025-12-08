import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client with the service role key.
 * This bypasses RLS and should only be used for admin operations
 * where authorization has already been verified at the API layer.
 *
 * ⚠️ SECURITY: Only use this after verifying user authorization via verifyAuth()
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
