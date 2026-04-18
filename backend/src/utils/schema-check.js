/**
 * Vérification automatique du schéma au démarrage
 * À importer dans server.js
 */

const supabase = require('../config/supabase');

const REQUIRED_TABLES = [
  { name: 'User', requiredColumns: ['id', 'name', 'email', 'password', 'created_at'] },
  { name: 'Document', requiredColumns: ['id', 'name', 'type', 'created_at'] },
  { name: 'Espace', requiredColumns: ['id', 'name', 'created_at'] },
  { name: 'Dossier', requiredColumns: ['id', 'name', 'espaceId'] },
  { name: 'Historique', requiredColumns: ['id', 'actionType', 'userId'] },
];

async function checkSchema() {
  console.log('🔍 Vérification du schéma de base de données...');
  
  const issues = [];
  
  for (const table of REQUIRED_TABLES) {
    try {
      // Test simple: essayer de sélectionner une colonne
      const { error } = await supabase
        .from(table.name)
        .select(table.requiredColumns[0])
        .limit(1);
      
      if (error) {
        issues.push({ table: table.name, error: error.message });
      }
    } catch (err) {
      issues.push({ table: table.name, error: err.message });
    }
  }
  
  if (issues.length > 0) {
    console.error('\n❌ PROBLÈMES DE SCHÉMA DÉTECTÉS:');
    issues.forEach(i => console.error(`   - ${i.table}: ${i.error}`));
    console.error('\n💡 Exécutez: npx supabase db reset OU appliquez backend/scripts/complete-schema.sql');
    return false;
  }
  
  console.log('✅ Schéma de base de données validé\n');
  return true;
}

module.exports = { checkSchema };
