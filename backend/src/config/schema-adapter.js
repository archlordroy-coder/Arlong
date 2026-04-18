/**
 * Adapteur de schéma - détecte et contourne les problèmes de cache PostgREST
 * Version basée sur le vrai schéma SQL fourni
 */

const supabase = require('./supabase');

class SchemaAdapter {
  constructor() {
    // D'après le schéma SQL fourni, ces colonnes EXISTENT
    this.knownSchema = {
      'User': ['id', 'name', 'email', 'password', 'avatar', 'is_admin', 'google_refresh_token', 'created_at', 'updated_at'],
      'Document': ['id', 'name', 'type', 'size', 'path', 'driveId', 'dossierId', 'espaceId', 'createdById', 'isDeleted', 'firebase_url', 'use_firebase_cache', 'firebase_cached_at', 'metadata', 'created_at', 'updated_at'],
      'Dossier': ['id', 'name', 'espaceId', 'createdById', 'isDeleted', 'isPublic', 'created_at', 'updated_at'],
      'Espace': ['id', 'name', 'createdById', 'isDeleted', 'created_at', 'updated_at'],
      'Historique': ['id', 'actionType', 'details', 'userId', 'docId', 'espaceId', 'actionDate', 'created_at'],
      'EspaceUser': ['id', 'userId', 'espaceId', 'role', 'joined_at']
    };
  }

  hasColumn(table, column) {
    return this.knownSchema[table]?.includes(column) || false;
  }

  /**
   * Crée une requête SELECT adaptée au schéma
   * Si des colonnes sont manquantes dans le cache PostgREST, on les exclut
   */
  async safeSelect(table, requestedColumns = '*', options = {}) {
    const { where = {}, orderBy = null, limit = null, single = false } = options;
    
    try {
      let query = supabase.from(table).select(requestedColumns);
      
      // Appliquer les filtres WHERE
      Object.entries(where).forEach(([col, val]) => {
        if (Array.isArray(val)) {
          query = query.in(col, val);
        } else {
          query = query.eq(col, val);
        }
      });
      
      // Ordre
      if (orderBy && this.hasColumn(table, orderBy.column)) {
        query = query.order(orderBy.column, { 
          ascending: orderBy.ascending ?? false 
        });
      }
      
      // Limite
      if (limit) {
        query = query.limit(limit);
      }
      
      const result = single ? await query.single() : await query;
      
      // Si erreur "column does not exist", c'est le cache PostgREST
      if (result.error && result.error.message.includes('does not exist')) {
        console.warn(`⚠️ Cache PostgREST obsolète pour ${table}, tentative sans colonnes problématiques...`);
        
        // Fallback : sélectionner uniquement les colonnes de base
        const safeColumns = this.getSafeColumns(table, requestedColumns);
        let fallbackQuery = supabase.from(table).select(safeColumns);
        
        // Réappliquer les filtres
        Object.entries(where).forEach(([col, val]) => {
          if (Array.isArray(val)) {
            fallbackQuery = fallbackQuery.in(col, val);
          } else {
            fallbackQuery = fallbackQuery.eq(col, val);
          }
        });
        
        if (limit) fallbackQuery = fallbackQuery.limit(limit);
        
        return single ? await fallbackQuery.single() : await fallbackQuery;
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Erreur dans safeSelect(${table}):`, error.message);
      throw error;
    }
  }

  /**
   * Extrait les colonnes sûres d'une requête SELECT
   */
  getSafeColumns(table, selectString) {
    if (selectString === '*') return '*';
    
    // Pour les jointures comme *,user:User(name), on simplifie
    if (selectString.includes(':')) {
      // Vérifier si la FK existe
      const fkMatch = selectString.match(/(\w+):\w+/);
      if (fkMatch) {
        const fkCol = fkMatch[1];
        if (!this.hasColumn(table, fkCol)) {
          // Retirer la jointure si la FK n'existe pas (ne devrait pas arriver)
          return selectString.replace(/,\s*\w+:\w+\([^)]+\)/g, '');
        }
      }
    }
    
    return selectString;
  }

  /**
   * Met à jour un utilisateur avec gestion du cache
   */
  async updateUser(userId, updates) {
    const allowedUpdates = {};
    
    // Filtrer uniquement les colonnes qui existent
    if (updates.google_refresh_token !== undefined) {
      allowedUpdates.google_refresh_token = updates.google_refresh_token;
    }
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.email !== undefined) allowedUpdates.email = updates.email;
    if (updates.avatar !== undefined) allowedUpdates.avatar = updates.avatar;
    
    try {
      const result = await supabase
        .from('User')
        .update(allowedUpdates)
        .eq('id', userId)
        .select();
      
      if (result.error && result.error.message.includes('google_refresh_token')) {
        console.warn('⚠️ Cache PostgREST: google_refresh_token non visible, retry...');
        // Attendre un peu et réessayer
        await new Promise(r => setTimeout(r, 500));
        return await supabase
          .from('User')
          .update(allowedUpdates)
          .eq('id', userId)
          .select();
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erreur updateUser:', error);
      throw error;
    }
  }
}

module.exports = new SchemaAdapter();
