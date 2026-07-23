import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  const tables = ['users', 'donations', 'messages', 'notifications', 'reports', 'foodsaver_store'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table "${t}":`, error.message);
    } else {
      console.log(`Table "${t}" EXISTS! Rows:`, data.length);
    }
  }
}

testStorage();
