/**
 * Client Supabase sans cache - crée une nouvelle instance à chaque appel
 * Pour contourner le cache PostgREST problématique
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function getFreshClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  
  // Créer un nouveau client à chaque fois (pas de cache partagé)
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        // Force le rechargement du schéma
        'Accept-Profile': 'public',
        'Content-Profile': 'public',
      },
    },
  });
}

module.exports = { getFreshClient };
