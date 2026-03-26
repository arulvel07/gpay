// ============================================================
// Supabase Configuration
// ============================================================

const SUPABASE_URL = 'https://fxqldchdtwrbotrncpwj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Lp648102fJQI9DHARoWOVQ_36-sHF56';

// Initialize Supabase client (use different name to avoid conflict with CDN global)
var supabaseClient = null;
try {
    if (window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized');
    } else {
        console.warn('⚠️ Supabase CDN not loaded, falling back to local data');
    }
} catch (err) {
    console.error('❌ Supabase init error:', err);
}

// Check if Supabase is configured and available
function isSupabaseConfigured() {
    return supabaseClient !== null &&
        SUPABASE_URL && SUPABASE_URL.startsWith('http') &&
        SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 20;
}
