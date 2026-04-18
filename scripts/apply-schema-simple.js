#!/usr/bin/env node
/**
 * Application du schéma SQL via API REST Supabase
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xmmtanweqsxqlfomgaxp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sqlFile = path.join(__dirname, '../backend/scripts/complete-schema.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

async function execSql(query) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql: query })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  
  return response.json();
}

async function applySchema() {
  console.log('🚀 Application du schéma SQL...\n');
  
  // Diviser en statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--'));
  
  console.log(`${statements.length} statements à exécuter\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 50).replace(/\s+/g, ' ');
    
    process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);
    
    try {
      await execSql(stmt + ';');
      console.log('✅');
    } catch (err) {
      // Ignorer certaines erreurs comme "table already exists"
      if (err.message.includes('already exists') || err.message.includes('does not exist')) {
        console.log('⚠️ (ignoré)');
      } else {
        console.log(`❌ ${err.message.substring(0, 80)}`);
      }
    }
  }
  
  console.log('\n✅ Schéma appliqué !');
}

applySchema().catch(console.error);
