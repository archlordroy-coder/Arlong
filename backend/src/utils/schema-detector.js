/**
 * Détecteur dynamique de schéma Supabase
 * Adapte les requêtes selon les colonnes disponibles
 */

const supabase = require('../config/supabase');

class SchemaDetector {
  constructor() {
    this.cache = {};
    this.cacheExpiry = null;
  }

  async getTableInfo(tableName) {
    // Cache pour éviter les appels répétés
    if (this.cache[tableName] && Date.now() < this.cacheExpiry) {
      return this.cache[tableName];
    }

    try {
      // Récupérer les colonnes via information_schema
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', tableName)
        .eq('table_schema', 'public');

      if (error) {
        // Fallback: tester directement les colonnes critiques
        return await this.fallbackDetection(tableName);
      }

      const columns = data.map(c => c.column_name);
      const info = {
        exists: true,
        columns: columns,
        hasCreatedAt: columns.includes('created_at'),
        hasUpdatedAt: columns.includes('updated_at'),
        hasGoogleRefreshToken: columns.includes('google_refresh_token'),
        hasUserId: columns.includes('userId') || columns.includes('userid'),
        hasDocId: columns.includes('docId') || columns.includes('docid'),
        timestamp: Date.now()
      };

      this.cache[tableName] = info;
      this.cacheExpiry = Date.now() + 60000; // Cache 1 minute
      return info;
    } catch (err) {
      return await this.fallbackDetection(tableName);
    }
  }

  async fallbackDetection(tableName) {
    const criticalColumns = {
      'User': ['google_refresh_token'],
      'Document': ['created_at', 'updated_at'],
      'Historique': ['created_at', 'userId'],
      'Espace': ['created_at', 'updated_at'],
      'Dossier': ['created_at']
    };

    const checks = criticalColumns[tableName] || [];
    const result = {
      exists: false,
      columns: [],
      hasCreatedAt: false,
      hasUpdatedAt: false,
      hasGoogleRefreshToken: false
    };

    for (const col of checks) {
      try {
        const { error } = await supabase.from(tableName).select(col).limit(1);
        if (!error || !error.message.includes(col)) {
          result.columns.push(col);
          if (col === 'created_at') result.hasCreatedAt = true;
          if (col === 'updated_at') result.hasUpdatedAt = true;
          if (col === 'google_refresh_token') result.hasGoogleRefreshToken = true;
        }
      } catch (e) {
        // Colonne manquante
      }
    }

    result.exists = result.columns.length > 0;
    return result;
  }

  buildSelect(tableName, baseSelect = '*') {
    const info = this.cache[tableName] || { columns: [] };
    
    // Si on veut la relation user et la colonne n'existe pas, on enlève la jointure
    if (baseSelect.includes('user:User') && !info.columns.includes('userId')) {
      return baseSelect.replace(/,\s*user:User\([^)]+\)/, '');
    }
    
    return baseSelect;
  }

  buildOrderBy(tableName, preferCreatedAt = true) {
    const info = this.cache[tableName] || {};
    
    if (preferCreatedAt && info.hasCreatedAt) {
      return { column: 'created_at', ascending: false };
    }
    if (info.hasUpdatedAt) {
      return { column: 'updated_at', ascending: false };
    }
    return { column: 'id', ascending: false };
  }
}

module.exports = new SchemaDetector();
