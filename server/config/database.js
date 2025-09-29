import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id') || supabaseKey.includes('your_supabase_service_role_key')) {
  console.warn('⚠️  Supabase not configured. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  console.warn('📝 Visit https://supabase.com to create a project and get your credentials.');
  
  // Create a mock client that will fail gracefully
  supabase = {
    from: () => ({
      select: () => ({ data: [], error: new Error('Supabase not configured') }),
      insert: () => ({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({ data: null, error: new Error('Supabase not configured') }),
      upsert: () => ({ data: null, error: new Error('Supabase not configured') }),
      single: () => ({ data: null, error: new Error('Supabase not configured') })
    })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export { supabase };
export default supabase;