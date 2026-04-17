const supabase = require('./src/config/supabase');

async function listAllTables() {
  try {
    const { data, error } = await supabase.rpc('get_tables'); // Si disponible
    
    // Sinon, on tente une approche plus brute pour voir ce qui existe
    const tables = ['User', 'users', 'users_list', 'Profiles', 'profiles'];
    console.log('--- Diagnostic des Tables ---');
    for (const t of tables) {
       const { error: err } = await supabase.from(t).select('id').limit(1);
       console.log(`Table "${t}" exists?`, !err);
       if (!err) {
         const { data: d } = await supabase.from(t).select('*').limit(1);
         if (d && d[0]) console.log(`Columns for "${t}":`, Object.keys(d[0]));
       }
    }
  } catch (err) {
    console.error('Check failed:', err);
  }
}

listAllTables();
