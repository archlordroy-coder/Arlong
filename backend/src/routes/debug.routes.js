const express = require('express');
const router = express.Router();
const { getFreshClient } = require('../config/supabase-fresh');
const supabase = require('../config/supabase');

/**
 * Debug: Test avec client normal vs client fresh
 * GET /api/debug/test-schema
 */
router.get('/test-schema', async (req, res) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Client normal (avec cache)
    try {
      const { data, error } = await supabase
        .from('User')
        .select('google_refresh_token')
        .limit(1);
      
      results.tests.normal_client = {
        status: error ? 'ERROR' : 'OK',
        error: error ? error.message : null
      };
    } catch (e) {
      results.tests.normal_client = { status: 'EXCEPTION', error: e.message };
    }

    // Test 2: Client fresh (sans cache)
    try {
      const fresh = getFreshClient();
      const { data, error } = await fresh
        .from('User')
        .select('google_refresh_token')
        .limit(1);
      
      results.tests.fresh_client = {
        status: error ? 'ERROR' : 'OK',
        error: error ? error.message : null
      };
    } catch (e) {
      results.tests.fresh_client = { status: 'EXCEPTION', error: e.message };
    }

    // Test 3: Document.created_at
    try {
      const { data, error } = await supabase
        .from('Document')
        .select('created_at')
        .limit(1);
      
      results.tests.document_created_at = {
        status: error ? 'ERROR' : 'OK',
        error: error ? error.message : null
      };
    } catch (e) {
      results.tests.document_created_at = { status: 'EXCEPTION', error: e.message };
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Debug: Forcer une requête SQL directe
 * POST /api/debug/sql
 */
router.post('/sql', async (req, res) => {
  try {
    // Utiliser rpc pour exécuter du SQL (nécessite une fonction SQL côté Supabase)
    res.json({ 
      message: 'Pour exécuter du SQL direct, créez une fonction RPC dans Supabase',
      alternative: 'Utilisez le SQL Editor dans le dashboard Supabase'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
