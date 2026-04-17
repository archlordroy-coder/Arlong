const supabase = require('./config/supabase');

async function checkSchema() {
  try {
    const { data: user, error: userError } = await supabase.from('User').select('*').limit(1);
    console.log('User Columns:', user ? Object.keys(user[0]) : 'No data');
    if (userError) console.error('User Error:', userError.message);

    const { data: version, error: versionError } = await supabase.from('AppVersion').select('*').limit(1);
    console.log('AppVersion Columns:', version ? Object.keys(version[0]) : 'No data');
    if (versionError) console.error('AppVersion Error:', versionError.message);
  } catch (err) {
    console.error('CheckSchema critical error:', err);
  }
}

checkSchema();
