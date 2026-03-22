import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not defined. This is expected on the client but will cause issues on the server.');
}

// Admin client for use in API routes (bypasses RLS)
// This file should ONLY be imported in server-side code (API routes, Server Actions, etc.)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'placeholder', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
