import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
dotenv.config({ quiet: true });
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("supabase connected");

export default supabase;