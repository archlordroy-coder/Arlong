-- ============================================================================
-- SCRIPT DE VÉRIFICATION SUPABASE - MboaDrive
-- ============================================================================

-- 1. VÉRIFICATION DES TABLES EXISTANTES
-- ----------------------------------------------------------------------------
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. STRUCTURE DE LA TABLE User
-- ----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- 3. STRUCTURE DE LA TABLE Espace
-- ----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Espace'
ORDER BY ordinal_position;

-- 4. STRUCTURE DE LA TABLE Dossier
-- ----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Dossier'
ORDER BY ordinal_position;

-- 5. STRUCTURE DE LA TABLE Document
-- ----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Document'
ORDER BY ordinal_position;

-- 6. STRUCTURE DE LA TABLE Historique
-- ----------------------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Historique'
ORDER BY ordinal_position;

-- 7. VÉRIFICATION DES CLÉS ÉTRANGÈRES
-- ----------------------------------------------------------------------------
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';

-- 8. VÉRIFICATION DES INDEX
-- ----------------------------------------------------------------------------
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 9. COMPTAGE DES ENREGISTREMENTS PAR TABLE
-- ----------------------------------------------------------------------------
SELECT 'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Espace', COUNT(*) FROM "Espace"
UNION ALL
SELECT 'Dossier', COUNT(*) FROM "Dossier"
UNION ALL
SELECT 'Document', COUNT(*) FROM "Document"
UNION ALL
SELECT 'Historique', COUNT(*) FROM "Historique"
UNION ALL
SELECT 'EspaceUser', COUNT(*) FROM "EspaceUser";

-- 10. VÉRIFICATION DES UTILISATEURS RÉCENTS
-- ----------------------------------------------------------------------------
SELECT id, name, email, is_admin, created_at
FROM "User"
ORDER BY created_at DESC
LIMIT 5;

-- 11. VÉRIFICATION DES ESPACES
-- ----------------------------------------------------------------------------
SELECT e.id, e.name, e."createdById", u.name as creator_name, e.created_at
FROM "Espace" e
LEFT JOIN "User" u ON e."createdById" = u.id
ORDER BY e.created_at DESC
LIMIT 5;

-- 12. VÉRIFICATION DES DOSSIERS PAR ESPACE
-- ----------------------------------------------------------------------------
SELECT d.id, d.name, d."espaceId", e.name as espace_name, d."createdById"
FROM "Dossier" d
LEFT JOIN "Espace" e ON d."espaceId" = e.id
ORDER BY d."espaceId", d.name
LIMIT 10;

-- 13. VÉRIFICATION DES POLITIQUES RLS (Row Level Security)
-- ----------------------------------------------------------------------------
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 14. STATUT RLS PAR TABLE
-- ----------------------------------------------------------------------------
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname IN ('User', 'Espace', 'Dossier', 'Document', 'Historique', 'EspaceUser')
AND relkind = 'r';

-- 15. VÉRIFICATION DES FONCTIONS/DÉCLENCHEURS
-- ----------------------------------------------------------------------------
SELECT trigger_name, event_object_table, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 16. TEST DE CONNEXION ET D'INSERTION (OPTIONNEL - À EXÉCUTER SEPARÉMENT)
-- ----------------------------------------------------------------------------
-- Décommenter pour tester:
-- INSERT INTO "User" (id, name, email, password) 
-- VALUES (gen_random_uuid(), 'Test User', 'test@example.com', 'hashed_password')
-- ON CONFLICT DO NOTHING;
