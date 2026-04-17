const supabase = require('./src/config/supabase');

async function debugSchemaMismatch() {
  const tables = ['Document', 'Historique'];
  
  for (const table of tables) {
    console.log(`--- Debugging ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      console.error(`Error reading ${table}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Real Columns for ${table}:`, Object.keys(data[0]));
    } else {
      console.log(`${table} is empty, cannot detect columns via select *`);
    }
  }
}

debugSchemaMismatch();
