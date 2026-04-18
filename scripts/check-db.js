const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || 'https://xmmtanweqsxqlfomgaxp.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Test Supabase:', url);
console.log('Clé:', key.substring(0, 20) + '...\n');

const supabase = createClient(url, key);

async function check() {
  // Test 1: Connexion
  console.log('1️⃣ Connexion...');
  try {
    const { error } = await supabase.from('User').select('id').limit(1);
    console.log(error ? '❌ ' + error.message : '✅ Connexion OK\n');
  } catch(e) {
    console.log('❌', e.message, '\n');
  }

  // Test 2: Colonnes critiques
  const checks = [
    {table: 'User', col: 'google_refresh_token'},
    {table: 'Document', col: 'created_at'},
    {table: 'Document', col: 'updated_at'},
    {table: 'Historique', col: 'created_at'},
    {table: 'Historique', col: 'userId'},
    {table: 'Espace', col: 'created_at'}
  ];

  console.log('2️⃣ Colonnes:');
  for (const c of checks) {
    try {
      const { error } = await supabase.from(c.table).select(c.col).limit(1);
      const status = error && error.message.includes(c.col) ? '❌ MANQUANT' : (error ? '⚠️ ' : '✅ OK');
      console.log(`   ${c.table}.${c.col}: ${status}${error && error.message.includes(c.col) ? '' : (error ? ' ' + error.message.substring(0,30) : '')}`);
    } catch(e) {
      console.log(`   ${c.table}.${c.col}: ❌ ${e.message.substring(0,30)}`);
    }
  }

  console.log('\n3️⃣ SQL à exécuter si ❌:');
  console.log(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "Historique" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "Historique" ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"(id);
ALTER TABLE "Espace" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`);
}

check();
