require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    console.log('Testing Supabase Connection...');
    console.log(`URL: ${supabaseUrl}`);
    console.log(`Key present: ${!!supabaseKey}`);

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing credentials');
        return;
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false }
        });

        // Test a simple operation
        const { data, error } = await supabase.from('profiles').select('*').limit(1);
        
        if (error) {
            console.error('Connection FAILED:', error.message);
        } else {
            console.log('Connection SUCCESS:', data);
        }
    } catch (e) {
        console.error('Connection THREW:', e);
    }
}

testSupabaseConnection();
