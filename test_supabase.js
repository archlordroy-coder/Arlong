// Test de connexion Supabase
const { createClient } = require('@supabase/supabase-js');

// Vos clés Supabase (CORRECTES)
const supabaseUrl = 'https://kzzniobqupcbvnflrthu.supabase.co';
const supabaseKey = 'sb_publishable_7oBHi4BbqoA7NMHwriW8xQ_DW_O360S';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔵 Test de connexion Supabase...\n');

  // Test 1: Vérifier la table User
  console.log('Test 1: Vérification table User');
  const { data: users, error: userError } = await supabase
    .from('User')
    .select('*')
    .limit(5);

  if (userError) {
    console.log('❌ Erreur:', userError.message);
  } else {
    console.log('✅ Table User accessible');
    console.log('   Nombre d\'utilisateurs:', users.length);
    if (users.length > 0) {
      console.log('   Premier user:', users[0].email);
    }
  }

  // Test 2: Vérifier les admins
  console.log('\nTest 2: Vérification admins');
  const { data: admins, error: adminError } = await supabase
    .from('User')
    .select('name, email, is_admin, password')
    .eq('is_admin', true);

  if (adminError) {
    console.log('❌ Erreur:', adminError.message);
  } else {
    console.log('✅ Admins trouvés:', admins.length);
    admins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
      console.log(`     Password: ${admin.password}`);
    });
  }

  // Test 3: Créer un utilisateur test
  console.log('\nTest 3: Création utilisateur test');
  const testEmail = 'test_' + Date.now() + '@test.com';
  const { data: newUser, error: createError } = await supabase
    .from('User')
    .insert([{
      name: 'Test User',
      email: testEmail,
      password: 'testpass',
      is_admin: false
    }])
    .select();

  if (createError) {
    console.log('❌ Erreur création:', createError.message);
  } else {
    console.log('✅ Utilisateur créé:', newUser[0].email);
  }

  console.log('\n🔵 Test terminé');
}

testConnection().catch(console.error);
