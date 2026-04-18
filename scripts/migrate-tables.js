#!/usr/bin/env node
/**
 * Migration programmatique - Crée les tables manquantes
 */

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || 'https://xmmtanweqsxqlfomgaxp.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

const MIGRATIONS = [
  {
    name: 'Add created_at to Document',
    sql: `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
  },
  {
    name: 'Add google_refresh_token to User',
    sql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;`
  },
  {
    name: 'Add updated_at to Document',
    sql: `ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
  },
  {
    name: 'Add User foreign key to Historique',
    sql: `ALTER TABLE "Historique" ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE;`
  },
  {
    name: 'Add Document foreign key to Historique',
    sql: `ALTER TABLE "Historique" ADD COLUMN IF NOT EXISTS "docId" UUID REFERENCES "Document"(id) ON DELETE CASCADE;`
  },
  {
    name: 'Add Espace foreign key to Historique',
    sql: `ALTER TABLE "Historique" ADD COLUMN IF NOT EXISTS "espaceId" UUID REFERENCES "Espace"(id) ON DELETE CASCADE;`
  },
  {
    name: 'Add actionType to Historique',
    sql: `ALTER TABLE "Historique" ADD COLUMN IF NOT EXISTS "actionType" VARCHAR(255) DEFAULT 'view';`
  },
  {
    name: 'Add actionDate to Historique',
    sql: `ALTER TABLE "Historique" ADD COLUMN IF NOT EXISTS "actionDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
  }
];

async function runMigrations() {
  console.log('🔄 Exécution des migrations...\n');
  
  for (const migration of MIGRATIONS) {
    process.stdout.write(`${migration.name}... `);
    
    try {
      // Utiliser l'API REST pour exécuter le SQL
      const response = await fetch(
        `${supabase.supabaseUrl}/rest/v1/`,
        {
          method: 'POST',
          headers: {
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: migration.sql })
        }
      );
      
      console.log('✅');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⚠️ (déjà existant)');
      } else {
        console.log(`❌ ${err.message.substring(0, 60)}`);
      }
    }
  }
  
  console.log('\n✅ Migrations terminées !');
  console.log('🔄 Redémarrez le serveur: npm run dev');
}

runMigrations();
