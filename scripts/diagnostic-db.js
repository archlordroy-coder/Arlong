#!/usr/bin/env node
/**
 * Diagnostic complet de la connexion Supabase
 */

const fs = require('fs');
const path = require('path');

// Lire les vraies variables d'environnement
const envPath = path.join(__dirname, '../backend/.env');
const envLocalPath = path.join(__dirname, '../backend/.env.local');

console.log('🔍 DIAGNOSTIC COMPLET SUPABASE');
console.log('==============================================\n');

// Lire les fichiers env
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Fichier .env trouvé');
} else {
  console.log('❌ Fichier .env NON trouvé');
}

if (fs.existsSync(envLocalPath)) {
  const localContent = fs.readFileSync(envLocalPath, 'utf8');
  console.log('✅ Fichier .env.local trouvé');
  envContent += '\n' + localContent;
} else {
  console.log('⚠️ Fichier .env.local NON trouvé');
}

// Parser SUPABASE_URL
const urlMatch = envContent.match(/SUPABASE_URL=(.+)/);
const url = urlMatch ? urlMatch[1].trim() : null;

console.log('\n📋 Configuration détectée :');
console.log(`URL: ${url || 'NON DÉFINIE ❌'}`);

if (url) {
  const projectId = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  console.log(`Project ID: ${projectId || 'Invalide'}`);
  
  if (projectId === 'xmmtanweqsxqlfomgaxp') {
    console.log('✅ URL correcte (xmmtanweqsxqlfomgaxp)');
  } else if (projectId === 'kzzniobqupcbvnflrthu') {
    console.log('🔴 ERREUR CRITIQUE : URL pointe sur l\'ANCIEN projet (kzzniobqupcbvnflrthu)');
    console.log('   → Tu as exécuté le SQL sur le mauvais projet !');
  } else {
    console.log(`⚠️ Project ID: ${projectId}`);
  }
}

console.log('\n🔗 URL Supabase attendue :');
console.log('https://app.supabase.com/project/xmmtanweqsxqlfomgaxp');
console.log('\n🎯 Action requise :');
console.log('1. Va sur https://app.supabase.com/project/xmmtanweqsxqlfomgaxp/sql-editor');
console.log('2. Vérifie que tu vois "xmmtanweqsxqlfomgaxp" en haut de la page');
console.log('3. Exécute le SQL fourni');
console.log('4. Relance ce diagnostic\n');

// Test de connexion rapide
if (url) {
  console.log('🧪 Test de connexion...');
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/) || envContent.match(/SUPABASE_ANON_KEY=(.+)/);
  const key = keyMatch ? keyMatch[1].trim() : null;
  
  if (key) {
    console.log(`Clé trouvée: ${key.substring(0, 20)}...`);
    
    // Test via curl
    const { exec } = require('child_process');
    const testQuery = `curl -s "${url}/rest/v1/" -H "apikey: ${key}" -H "Authorization: Bearer ${key}" 2>&1 | head -5`;
    
    exec(testQuery, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Erreur connexion:', error.message);
      } else {
        console.log('Réponse Supabase:', stdout.substring(0, 200));
      }
      
      // Test colonne
      console.log('\n🧪 Test colonne Document.created_at...');
      const colTest = `curl -s "${url}/rest/v1/Document?select=created_at&limit=1" -H "apikey: ${key}" -H "Authorization: Bearer ${key}" 2>&1`;
      
      exec(colTest, (err, out, err2) => {
        if (out.includes('does not exist') || out.includes('42703')) {
          console.log('❌ Colonne Document.created_at: MANQUANTE');
          console.log('   → Le SQL n\'a PAS été appliqué sur CE projet');
        } else if (out.includes('[') || out.includes('{')) {
          console.log('✅ Colonne Document.created_at: EXISTE');
        } else {
          console.log('⚠️ Réponse:', out.substring(0, 100));
        }
      });
    });
  } else {
    console.log('❌ Aucune clé Supabase trouvée');
  }
}
