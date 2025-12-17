import 'dotenv/config';

export const env = {
    port: Number(process.env.PORT || 3001),
    nodeEnv: process.env.NODE_ENV || 'development',

    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

    validate() {
        if (!this.supabaseUrl || !this.supabaseServiceRoleKey) {
            console.warn('⚠️ Supabase credentials not configured');
            console.warn('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
        }
    }
};

env.validate();