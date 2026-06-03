const { createClient } = require('@supabase/supabase-js');

/**
 * Initializes the Supabase client using environment variables.
 */
const supabaseUrl = process.env.SUPABASE_URL;
// Use Service Role Key for backend admin operations if available, otherwise fallback to Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
    console.warn('⚠️  [Supabase] Missing or default credentials. Database connection may fail.');
}

// Initialize with service role key to bypass RLS for backend tasks
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('✅ [Supabase] Client initialized (Backend/Admin mode).');

module.exports = {
    supabase
};