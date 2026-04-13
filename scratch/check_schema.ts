import { supabaseAdmin } from './src/lib/supabaseAdmin.ts';

async function checkSchema() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('User columns:', Object.keys(data[0]));
  } else {
    console.log('No users found to check columns.');
  }
}

checkSchema();
