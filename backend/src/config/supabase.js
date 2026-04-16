const { createClient } = require('@supabase/supabase-js');

// Variables standard pour Vercel
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use SERVICE_ROLE_KEY if available (for admin operations), fallback to ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// En développement, on affiche un warning au lieu de planter
if (!supabaseUrl || !supabaseKey) {
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
