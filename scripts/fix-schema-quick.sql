-- =============================================================================
-- FIX RAPIDE DU SCHÉMA (sans tout dropper)
-- Exécutez dans Supabase SQL Editor: https://app.supabase.com/project/xmmtanweqsxqlfomgaxp/sql-editor
-- =============================================================================

-- 1. Ajouter google_refresh_token à User (pour Google Drive)
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;

-- 2. Ajouter created_at et updated_at à Document
ALTER TABLE "Document" 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Ajouter created_at à Espace
ALTER TABLE "Espace" 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Ajouter les colonnes FK à Historique
ALTER TABLE "Historique" 
  ADD COLUMN IF NOT EXISTS "userId" UUID,
  ADD COLUMN IF NOT EXISTS "docId" UUID,
  ADD COLUMN IF NOT EXISTS "espaceId" UUID,
  ADD COLUMN IF NOT EXISTS "actionType" VARCHAR(255) DEFAULT 'view',
  ADD COLUMN IF NOT EXISTS "actionDate" TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Créer les clés étrangères (FK)
DO $$
BEGIN
  -- FK Historique -> User
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Historique_userId_fkey'
  ) THEN
    ALTER TABLE "Historique" 
      ADD CONSTRAINT "Historique_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;

  -- FK Historique -> Document
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Historique_docId_fkey'
  ) THEN
    ALTER TABLE "Historique" 
      ADD CONSTRAINT "Historique_docId_fkey" 
      FOREIGN KEY ("docId") REFERENCES "Document"(id) ON DELETE SET NULL;
  END IF;

  -- FK Historique -> Espace
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Historique_espaceId_fkey'
  ) THEN
    ALTER TABLE "Historique" 
      ADD CONSTRAINT "Historique_espaceId_fkey" 
      FOREIGN KEY ("espaceId") REFERENCES "Espace"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Désactiver RLS (Row Level Security) au cas où
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Espace" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Dossier" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Historique" DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- VÉRIFICATION
-- =============================================================================
SELECT 'User.google_refresh_token' as check_column, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='User' AND column_name='google_refresh_token') 
            THEN '✅ OK' ELSE '❌ MANQUANT' END as status
UNION ALL
SELECT 'Document.created_at', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='Document' AND column_name='created_at') 
            THEN '✅ OK' ELSE '❌ MANQUANT' END
UNION ALL
SELECT 'Historique.userId FK', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.table_constraints 
                         WHERE table_name='Historique' AND constraint_name='Historique_userId_fkey') 
            THEN '✅ OK' ELSE '❌ MANQUANT' END;
