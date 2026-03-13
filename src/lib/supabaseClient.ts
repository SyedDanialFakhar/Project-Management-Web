import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://crgmeudnagkqkbhqetkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZ21ldWRuYWdrcWtiaHFldGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzgwNzIsImV4cCI6MjA4ODc1NDA3Mn0.mDtTQTwdtq1ixq3p0nkVj_JiAbwejz0MXC0r3KlD8GI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
