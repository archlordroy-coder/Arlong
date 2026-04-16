#!/usr/bin/env node
// ============================================================================
// SCRIPT DE VÉRIFICATION SUPABASE - API JavaScript
// ============================================================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   SUPABASE_URL ou VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('==============================================');
  console.log('🔍 VÉRIFICATION SUPABASE - API JavaScript');
  console.log('==============================================\n');
  
  try {
    // 1. Test de connexion
    console.log('1️⃣  TEST DE CONNEXION');
    console.log('---------------------');
    const { data: health, error: healthError } = await supabase.from('User').select('id').limit(1);
    if (healthError) throw healthError;
    console.log('✅ Connexion Supabase OK\n');
    
    // 2. Liste des tables
    console.log('2️⃣  LISTE DES TABLES');
    console.log('--------------------');
    const tables = ['User', 'Espace', 'Dossier', 'Document', 'Historique', 'EspaceUser'];
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} enregistrements`);
      }
    }
    console.log('');
    
    // 3. Utilisateurs récents
    console.log('3️⃣  UTILISATEURS RÉCENTS');
    console.log('-------------------------');
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, name, email, is_admin, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (usersError) {
      console.log('❌ Erreur:', usersError.message);
    } else {
      users.forEach(u => {
        console.log(`   ${u.name} (${u.email}) - Admin: ${u.is_admin} - Créé: ${u.created_at}`);
      });
    }
    console.log('');
    
    // 4. Espaces
    console.log('4️⃣  ESPACES');
    console.log('------------');
    const { data: espaces, error: espacesError } = await supabase
      .from('Espace')
      .select('id, name, createdById, created_at')
      .limit(5);
    
    if (espacesError) {
      console.log('❌ Erreur:', espacesError.message);
    } else {
      espaces.forEach(e => {
        console.log(`   ${e.name} (ID: ${e.id}) - Créé par: ${e.createdById}`);
      });
    }
    console.log('');
    
    // 5. Dossiers par espace
    console.log('5️⃣  DOSSIERS PAR ESPACE');
    console.log('------------------------');
    const { data: dossiers, error: dossiersError } = await supabase
      .from('Dossier')
      .select('id, name, espaceId, createdById')
      .limit(10);
    
    if (dossiersError) {
      console.log('❌ Erreur:', dossiersError.message);
    } else {
      const grouped = dossiers.reduce((acc, d) => {
        acc[d.espaceId] = (acc[d.espaceId] || 0) + 1;
        return acc;
      }, {});
      Object.entries(grouped).forEach(([espaceId, count]) => {
        console.log(`   Espace ${espaceId}: ${count} dossier(s)`);
      });
    }
    console.log('');
    
    // 6. Vérification des colonnes User
    console.log('6️⃣  COLONNES TABLE User');
    console.log('------------------------');
    const { data: userColumns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: 'User' })
      .catch(() => ({ data: null, error: { message: 'Fonction RPC non disponible' } }));
    
    if (colError) {
      // Fallback: vérifier via select
      const { data: sample, error: sampleError } = await supabase
        .from('User')
        .select('*')
        .limit(1);
      if (sample && sample[0]) {
        console.log('   Colonnes:', Object.keys(sample[0]).join(', '));
      }
    }
    console.log('');
    
    // 7. Historique
    console.log('7️⃣  HISTORIQUE');
    console.log('--------------');
    const { data: histo, error: histoError } = await supabase
      .from('Historique')
      .select('id, actionType, userId, actionDate')
      .order('actionDate', { ascending: false })
      .limit(5);
    
    if (histoError) {
      console.log('❌ Erreur:', histoError.message);
    } else if (histo && histo.length > 0) {
      histo.forEach(h => {
        console.log(`   ${h.actionType} par ${h.userId} le ${h.actionDate}`);
      });
    } else {
      console.log('   Aucun historique trouvé');
    }
    console.log('');
    
    // 8. Test d'insertion (optionnel)
    console.log('8️⃣  TEST D\'INSERTION');
    console.log('----------------------');
    const testEmail = `test_${Date.now()}@example.com`;
    const { data: newUser, error: insertError } = await supabase
      .from('User')
      .insert([{ 
        name: 'Test Verification', 
        email: testEmail,
        password: 'test_hash'
      }])
      .select('id')
      .single();
    
    if (insertError) {
      console.log('❌ Erreur insertion:', insertError.message);
    } else {
      console.log(`✅ Insertion OK (ID: ${newUser.id})`);
      // Nettoyage
      await supabase.from('User').delete().eq('id', newUser.id);
      console.log('✅ Nettoyage OK');
    }
    console.log('');
    
    console.log('==============================================');
    console.log('✅ VÉRIFICATION TERMINÉE AVEC SUCCÈS');
    console.log('==============================================');
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyDatabase();
