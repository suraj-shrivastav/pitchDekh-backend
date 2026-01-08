import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config({ quiet: true });
const SUPABASE_URL = process.env.SUPABASE_URL || "https://nfsmznzjcpshzxwnbuql.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_Lx0v73zsdQwFR4v1GTYfig_Mj4T2u-C";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;