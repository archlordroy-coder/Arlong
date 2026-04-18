#!/usr/bin/env node
/**
 * Script de test de connexion Supabase et vérification des tables
 * Usage: node scripts/test-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration depuis les variables d'environnement ou valeurs par défaut
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xmmtanweqsxqlfomgaxp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 Test de connexion Supabase');
console.log('==============================================');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Clé: ${SUPABASE_KEY ? SUPABASE_KEY.substring(0, 20) + '...' : 'NON DÉFINIE ❌'}`);
console.log('');

if (!SUPABASE_KEY) {
  console.error('❌ ERREUR: SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY manquante');
  console.log('');
  console.log('Solutions:');
  console.log('1. Définissez les variables dans .env.local:');
  console.log('   SUPABASE_URL=https://xmmtanweqsxqlfomgaxp.supabase.co');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...');
  console.log('');
  console.log('2. Ou exécutez avec les variables:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx node scripts/test-supabase.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Tables et colonnes à vérifier
const REQUIRED_SCHEMA = {
  'User': ['id', 'name', 'email', 'password', 'google_refresh_token', 'created_at'],
  'Document': ['id', 'name', 'type', 'created_at', 'updated_at', 'createdById'],
  'Espace': ['id', 'name', 'created_at', 'updated_at', 'createdById'],
  'Dossier': ['id', 'name', 'espaceId', 'createdById'],
  'Historique': ['id', 'actionType', 'userId', 'created_at']
};

async function testConnection() {
  console.log('1️⃣  Test de connexion basique...');
  try {
    const { data, error } = await supabase.from('User').select('count').limit(1);
    if (error) throw error;
    console.log('   ✅ Connexion Supabase OK');
    return true;
  } catch (err) {
    console.log('   ❌ Erreur de connexion:', err.message);
    return false;
  }
}

async function checkTables() {
  console.log('');
  console.log('2️⃣  Vérification des tables...');
  
  for (const [tableName, requiredColumns] of Object.entries(REQUIRED_SCHEMA)) {
    process.stdout.write(`   Table "${tableName}"... `);
    
    try {
      // Tester si la table existe
      const { data, error } = await supabase
        .from(tableName)
        .select(requiredColumns[0])
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log('❌ TABLE MANQUANTE');
        } else if (error.message.includes('column')) {
          console.log('⚠️  COLONNE MANQUANTE:', error.message);
        } else {
          console.log('⚠️  ERREUR:', error.message.substring(0, 50));
        }
      } else {
        console.log('✅ OK');
      }
    } catch (err) {
      console.log('❌ ERREUR:', err.message.substring(0, 50));
    }
  }
}

async function checkSpecificColumns() {
  console.log('');
  console.log('3️⃣  Vérification des colonnes critiques...');
  
  const criticalChecks = [
    { table: 'User', column: 'google_refresh_token', purpose: 'Google Drive' },
    { table: 'Document', column: 'created_at', purpose: 'Tri documents' },
    { table: 'Document', column: 'updated_at', purpose: 'Tri documents fallback' },
    { table: 'Historique', column: 'created_at', purpose: 'Tri historique' },
    { table: 'Historique', column: 'userId', purpose: 'Relation User' },
    { table: 'Espace', column: 'created_at', purpose: 'Tri espaces' }
  ];
  
  for (const check of criticalChecks) {
    process.stdout.write(`   ${check.table}.${check.column} (${check.purpose})... `);
    
    try {
      const { error } = await supabase
        .from(check.table)
        .select(check.column)
        .limit(1);
      
      if (error && error.message.includes(check.column)) {
        console.log('❌ MANQUANT');
      } else if (error) {
        console.log('⚠️  ', error.message.substring(0, 40));
      } else {
        console.log('✅ OK');
      }
    } catch (err) {
      console.log('❌', err.message.substring(0, 40));
    }
  }
}

async function testInsert() {
  console.log('');
  console.log('4️⃣  Test d\'insertion (User)...');
  
  const testEmail = `test_${Date.now()}@example.com`;
  try {
    const { data, error } = await supabase
      .from('User')
      .insert([{
        name: 'Test User',
        email: testEmail,
        password: 'hashed_password_test'
      }])
      .select('id, name, email')
      .single();
    
    if (error) {
      console.log('   ❌ ÉCHEC:', error.message);
      if (error.message.includes('google_refresh_token')) {
        console.log('   💡 La colonne google_refresh_token est manquante !');
      }
      return false;
    } else {
      console.log('   ✅ Insertion OK (ID:', data.id.substring(0, 8) + '...)');
      
      // Cleanup
      await supabase.from('User').delete().eq('id', data.id);
      console.log('   🗑️  Test nettoyé');
      return true;
    }
  } catch (err) {
    console.log('   ❌ ERREUR:', err.message);
    return false;
  }
}

async function generateFixSQL() {
  console.log('');
  console.log('5️⃣  Génération des corrections SQL...');
  console.log('   Copiez et exécutez dans Supabase SQL Editor:');
  console.log('   https://app.supabase.com/project/xmmtanweqsxqlfomgaxp/sql-editor');
  console.log('');
  console.log('--- SQL À EXÉCUTER ---');
  console.log(`
-- Corrections rapides
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "Historique" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "Historique" ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Espace" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Vérification
SELECT 'User.google_refresh_token' as colonne, 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='google_refresh_token') 
  THEN 'OK' ELSE 'MANQUANT' END as status
UNION ALL
SELECT 'Document.created_at', 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Document' AND column_name='created_at') 
  THEN 'OK' ELSE 'MANQUANT' END;
`);
  console.log('--- FIN SQL ---');
}

async function main() {
  const connected = await testConnection();
  if (!connected) {
    console.log('');
    console.log('💡 Impossible de continuer sans connexion Supabase');
    process.exit(1);
  }
  
  await checkTables();
  await checkSpecificColumns();
  await testInsert();
  await generateFixSQL();
  
  console.log('');
  console.log('==============================================');
  console.log('✅ Test terminé !');
  console.log('');
  console.log('Prochaines étapes si des colonnes sont manquantes:');
  console.log('1. Copiez le SQL généré ci-dessus');
  console.log('2. Allez sur https://app.supabase.com/project/xmmtanweqsxqlfomgaxp/sql-editor');
  console.log('3. Collez et exécutez le SQL');
  console.log('4. Relancez ce script pour vérifier');
}

main().catch(console.error);
