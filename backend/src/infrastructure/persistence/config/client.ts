import { createClient } from '@supabase/supabase-js';
import { env } from '../../enviroment/env';

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error('Missing Supabase env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

export async function initializeDatabase() {
    try {
        console.log('[DB Init] Starting Supabase connection verification...');
        console.log('[DB Init] Supabase URL:', env.supabaseUrl);

        const { data, error } = await supabase.from('boards').select('count');

        if (error) {
            console.error('[DB Init] Query error:', error.code, error.message);
            throw error;
        }

        console.log('[DB Init] Supabase connection verified successfully');
        console.log('[DB Init] Query response:', data);
    } catch (err: any) {
        console.error('[DB Init] Supabase connection error:', err.message);
        console.error('[DB Init] Error details:', err);
        console.log('[DB Init] Ensure tables exist or run migrations');
    }
}