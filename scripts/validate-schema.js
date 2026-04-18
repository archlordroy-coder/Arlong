#!/usr/bin/env node
/**
 * Validation du schéma de base de données
 * Vérifie que toutes les tables et colonnes existent
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://xmmtanweqsxqlfomgaxp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const REQUIRED_SCHEMA = {
  'User': ['id', 'name', 'email', 'password', 'avatar', 'is_admin', 'google_refresh_token', 'created_at', 'updated_at'],
  'Document': ['id', 'name', 'type', 'size', 'path', 'driveId', 'dossierId', 'espaceId', 'createdById', 'isDeleted', 'created_at', 'updated_at', 'firebase_url'],
  'Espace': ['id', 'name', 'createdById', 'isDeleted', 'created_at', 'updated_at'],
  'Dossier': ['id', 'name', 'espaceId', 'createdById', 'isDeleted', 'created_at', 'updated_at'],
  'Historique': ['id', 'actionType', 'details', 'userId', 'docId', 'espaceId', 'actionDate', 'created_at'],
  'EspaceUser': ['id', 'userId', 'espaceId', 'role', 'joined_at'],
};

async function validateSchema() {
  console.log('🔍 Validation du schéma de base de données...\n');
  
  const missing = [];
  const existing = [];
  
  for (const [table, columns] of Object.entries(REQUIRED_SCHEMA)) {
    // Vérifier si la table existe
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', table)
      .eq('table_schema', 'public')
      .single();
    
    if (tableError || !tableExists) {
      missing.push(`❌ Table manquante: ${table}`);
      continue;
    }
    
    // Vérifier les colonnes
    const { data: columnsData, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', table)
      .eq('table_schema', 'public');
    
    if (colError) {
      missing.push(`❌ Erreur lecture colonnes ${table}: ${colError.message}`);
      continue;
    }
    
    const existingCols = columnsData.map(c => c.column_name);
    const missingCols = columns.filter(c => !existingCols.includes(c));
    
    if (missingCols.length > 0) {
      missing.push(`⚠️  Table ${table}: colonnes manquantes [${missingCols.join(', ')}]`);
    } else {
      existing.push(`✅ Table ${table}: OK (${columns.length} colonnes)`);
    }
  }
  
  console.log('📊 RAPPORT DE VALIDATION\n' + '='.repeat(50));
  
  if (existing.length > 0) {
    console.log('\n✅ Éléments valides:');
    existing.forEach(e => console.log(`  ${e}`));
  }
  
  if (missing.length > 0) {
    console.log('\n❌ Problèmes détectés:');
    missing.forEach(m => console.log(`  ${m}`));
    console.log('\n💡 Solution: Exécutez backend/scripts/complete-schema.sql sur Supabase');
    process.exit(1);
  } else {
    console.log('\n🎉 Schéma validé avec succès !');
    process.exit(0);
  }
}

validateSchema();
