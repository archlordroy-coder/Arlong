const supabase = require('./src/config/supabase');

async function checkUserTable() {
  try {
    const { data, error } = await supabase.from('User').select('*').limit(1);
    
    if (error) {
       console.error('Check failed:', error);
       return;
    }

    if (data && data.length > 0) {
      console.log('User Columns Found:', Object.keys(data[0]));
    } else {
      console.log('User table is empty, checking schema directly...');
      // Si la table est vide, on tente de deviner via une insertion fantôme (rollbackée si possible)
      // Mais ici on va juste lister les clés d'un objet vide si possible via RPC ou autre
    }
  } catch (err) {
    console.error('Check failed:', err);
  }
}

checkUserTable();
