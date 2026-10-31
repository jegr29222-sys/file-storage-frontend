import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lhzixpsothjpyuiepeuf.supabase.co';
const supabaseAnonKey = 'sb_publishable_qnOoTcdM-PQsc3zYPn2DzA_ggwyjcju';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);