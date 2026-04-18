-- =============================================================================
-- EXPORT COMPLET DU SCHÉMA SUPABASE
-- Exécute ceci dans Supabase SQL Editor puis copie le résultat
-- =============================================================================

-- 1. LISTE DE TOUTES LES TABLES
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. STRUCTURE COMPLÈTE (Tables + Colonnes + Types)
SELECT 
    c.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.is_nullable,
    c.column_default,
    CASE WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY' ELSE '' END as key_type
FROM information_schema.columns c
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku 
        ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- 3. CLÉS ÉTRANGÈRES (Foreign Keys)
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';

-- 4. INDEXES
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. ROW LEVEL SECURITY (RLS) STATUS
SELECT 
    schemaname,
    tablename,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_tables
JOIN pg_class ON pg_tables.tablename = pg_class.relname
WHERE schemaname = 'public';

-- 6. DÉCOMPTES PAR TABLE (optionnel - pour voir si des données existent)
SELECT 
    'User' as table_name, 
    COUNT(*) as row_count 
FROM "User"
UNION ALL
SELECT 'Document', COUNT(*) FROM "Document"
UNION ALL
SELECT 'Espace', COUNT(*) FROM "Espace"
UNION ALL
SELECT 'Dossier', COUNT(*) FROM "Dossier"
UNION ALL
SELECT 'Historique', COUNT(*) FROM "Historique"
UNION ALL
SELECT 'EspaceUser', COUNT(*) FROM "EspaceUser";
