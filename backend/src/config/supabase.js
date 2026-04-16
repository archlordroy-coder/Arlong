const { createClient } = require('@supabase/supabase-js');

// Variables VITE_* pour compatibilité avec le frontend
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use VITE_SUPABASE_PUBLISHABLE_KEY ou SERVICE_ROLE_KEY
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'NOT SET');
  console.error('   VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? 'Set' : 'NOT SET');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Les variables d\'environnement Supabase sont manquantes.');
  } else {
    console.warn('⚠️  Variables Supabase manquantes - Certaines fonctionnalités seront désactivées');
    // Retourner un mock pour le dev
    module.exports = {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: { message: 'Supabase non configuré' } }),
        insert: () => Promise.resolve({ data: null, error: { message: 'Supabase non configuré' } }),
        update: () => Promise.resolve({ data: null, error: { message: 'Supabase non configuré' } }),
        delete: () => Promise.resolve({ data: null, error: { message: 'Supabase non configuré' } }),
      }),
      auth: {
        signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase non configuré' } }),
        signIn: () => Promise.resolve({ data: null, error: { message: 'Supabase non configuré' } }),
      }
    };
    return;
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
