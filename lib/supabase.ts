import { createClient } from '@supabase/supabase-js';

// 確保在 Build 階段如果沒有抓到環境變數，有合法格式的預設 URL 防摔
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);