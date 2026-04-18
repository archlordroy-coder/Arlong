const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

/**
 * Admin route to refresh Supabase connection and clear schema cache issues
 * POST /api/admin/refresh-schema
 */
router.post('/refresh-schema', async (req, res) => {
  try {
    console.log('🔵 Refreshing Supabase connection...');
    
    // Recreate the Supabase client with fresh connection
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        message: 'Missing Supabase configuration'
      });
    }
    
    // Test the connection with a fresh client
    const freshClient = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    
    // Test critical columns
    const tests = {
      user: await freshClient.from('User').select('google_refresh_token').limit(1),
      document: await freshClient.from('Document').select('created_at').limit(1),
      historique: await freshClient.from('Historique').select('created_at').limit(1)
    };
    
    const results = {};
    for (const [table, result] of Object.entries(tests)) {
      results[table] = result.error ? {
        status: 'error',
        message: result.error.message
      } : {
        status: 'ok'
      };
    }
    
    res.json({
      success: true,
      message: 'Schema refresh attempted',
      tests: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Refresh error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Check current schema status
 * GET /api/admin/schema-status
 */
router.get('/schema-status', async (req, res) => {
  try {
    const supabase = require('../config/supabase');
    
    const checks = [
      { table: 'User', column: 'google_refresh_token' },
      { table: 'Document', column: 'created_at' },
      { table: 'Document', column: 'updated_at' },
      { table: 'Historique', column: 'created_at' },
      { table: 'Historique', column: 'userId' },
      { table: 'Espace', column: 'created_at' }
    ];
    
    const results = {};
    
    for (const check of checks) {
      try {
        const { error } = await supabase
          .from(check.table)
          .select(check.column)
          .limit(1);
        
        results[`${check.table}.${check.column}`] = error && error.message.includes(check.column) 
          ? 'MISSING ❌' 
          : 'OK ✅';
      } catch (e) {
        results[`${check.table}.${check.column}`] = 'ERROR ❌';
      }
    }
    
    res.json({
      success: true,
      schema: results,
      fixSql: `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "Historique" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE "Historique" ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "User"(id);
ALTER TABLE "Espace" ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`,
      note: 'If columns show MISSING, execute the SQL above in Supabase SQL Editor'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
