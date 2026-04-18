#!/usr/bin/env node
/**
 * Script d'application du schéma SQL sur Supabase
 * Usage: node scripts/apply-schema.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xmmtanweqsxqlfomgaxp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Clé Supabase manquante. Définissez SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Lire le fichier SQL
const sqlFile = path.join(__dirname, '../backend/scripts/complete-schema.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Diviser en statements individuels (éviter les erreurs avec les transactions)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

console.log(`🔄 ${statements.length} statements à exécuter...\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applySchema() {
  const errors = [];
  const success = [];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 50).replace(/\s+/g, ' ');
    
    process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

    try {
      // Exécuter via RPC ou REST API
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      
      if (error) {
        // Si exec_sql n'existe pas, utiliser la méthode alternative
        console.log('⚠️');
        errors.push({ stmt: preview, error: error.message });
      } else {
        console.log('✅');
        success.push(preview);
      }
    } catch (err) {
      console.log('❌');
      errors.push({ stmt: preview, error: err.message });
    }
  }

  console.log(`\n📊 Résultat: ${success.length} succès, ${errors.length} erreurs`);
  
  if (errors.length > 0) {
    console.log('\n❌ Erreurs détectées:');
    errors.forEach((e, i) => console.log(`  ${i + 1}. ${e.stmt}: ${e.error}`));
  }
}

// Méthode alternative avec fetch direct à l'API REST
async function applySchemaViaRest() {
  console.log('🚀 Application du schéma via API REST...\n');
  
  // Diviser le SQL en blocs plus petits
  const chunks = sql.split(/;(?!\*)/).filter(s => s.trim().length > 10);
  
  for (const chunk of chunks) {
    const cleanChunk = chunk.trim();
    if (!cleanChunk || cleanChunk.startsWith('--')) continue;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql: cleanChunk + ';' })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.log(`⚠️  Erreur: ${error.substring(0, 100)}`);
      } else {
        console.log(`✅ ${cleanChunk.substring(0, 40).replace(/\n/g, ' ')}...`);
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }
}

// Exécuter
applySchemaViaRest().catch(console.error);
