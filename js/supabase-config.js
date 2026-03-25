// ============================================================
// Supabase Configuration
// ============================================================
// 1. Go to https://supabase.com → Create a project
// 2. Go to Project Settings → API
// 3. Copy your Project URL and anon/public key below

const SUPABASE_URL = 'https://fxqldchdtwrbotrncpwj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Lp648102fJQI9DHARoWOVQ_36-sHF56';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    return SUPABASE_URL !== 'https://fxqldchdtwrbotrncpwj.supabase.co' && SUPABASE_ANON_KEY !== 'sb_publishable_Lp648102fJQI9DHARoWOVQ_36-sHF56';
};
