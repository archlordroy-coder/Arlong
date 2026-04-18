-- =============================================================================
-- SCRIPT SQL COMPLET POUR NOUVEAU PROJET SUPABASE
-- MboaDrive - Création de toutes les tables avec contraintes
-- =============================================================================

-- Activer l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. TABLE USER (créer d'abord car référencée par les autres)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar TEXT,
    is_admin BOOLEAN DEFAULT false,
    google_refresh_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE "User" IS 'Utilisateurs de l application';
COMMENT ON COLUMN "User".google_refresh_token IS 'Token OAuth Google Drive';

-- =============================================================================
-- 2. TABLE ESPACE
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Espace" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    "createdById" UUID NOT NULL,
    "isDeleted" BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "Espace_createdById_fkey" 
        FOREIGN KEY ("createdById") REFERENCES "User"(id) ON DELETE CASCADE
);

COMMENT ON TABLE "Espace" IS 'Espaces de stockage';

-- =============================================================================
-- 3. TABLE DOSSIER
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Dossier" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    "espaceId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "isDeleted" BOOLEAN DEFAULT false,
    "isPublic" BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "Dossier_espaceId_fkey" 
        FOREIGN KEY ("espaceId") REFERENCES "Espace"(id) ON DELETE CASCADE,
    CONSTRAINT "Dossier_createdById_fkey" 
        FOREIGN KEY ("createdById") REFERENCES "User"(id) ON DELETE CASCADE
);

COMMENT ON TABLE "Dossier" IS 'Dossiers dans les espaces';

-- =============================================================================
-- 4. TABLE DOCUMENT
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Document" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    size INTEGER,
    path TEXT,
    "driveId" TEXT,
    "dossierId" UUID,
    "espaceId" UUID,
    "createdById" UUID,
    "isDeleted" BOOLEAN DEFAULT false,
    firebase_url TEXT,
    use_firebase_cache BOOLEAN DEFAULT false,
    firebase_cached_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "Document_dossierId_fkey" 
        FOREIGN KEY ("dossierId") REFERENCES "Dossier"(id) ON DELETE SET NULL,
    CONSTRAINT "Document_espaceId_fkey" 
        FOREIGN KEY ("espaceId") REFERENCES "Espace"(id) ON DELETE SET NULL,
    CONSTRAINT "Document_createdById_fkey" 
        FOREIGN KEY ("createdById") REFERENCES "User"(id) ON DELETE SET NULL
);

COMMENT ON TABLE "Document" IS 'Documents stockés';
COMMENT ON COLUMN "Document"."driveId" IS 'ID du fichier dans Google Drive';

-- =============================================================================
-- 5. TABLE ESPACEUSER (membres des espaces)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "EspaceUser" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "espaceId" UUID NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "EspaceUser_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "EspaceUser_espaceId_fkey" 
        FOREIGN KEY ("espaceId") REFERENCES "Espace"(id) ON DELETE CASCADE,
    
    -- Un utilisateur ne peut être membre qu'une fois par espace
    UNIQUE("userId", "espaceId")
);

COMMENT ON TABLE "EspaceUser" IS 'Membres des espaces collaboratifs';

-- =============================================================================
-- 6. TABLE HISTORIQUE
-- =============================================================================
CREATE TABLE IF NOT EXISTS "Historique" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "actionType" VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    "userId" UUID NOT NULL,
    "docId" UUID,
    "espaceId" UUID,
    "actionDate" TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "Historique_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "Historique_docId_fkey" 
        FOREIGN KEY ("docId") REFERENCES "Document"(id) ON DELETE SET NULL,
    CONSTRAINT "Historique_espaceId_fkey" 
        FOREIGN KEY ("espaceId") REFERENCES "Espace"(id) ON DELETE SET NULL
);

COMMENT ON TABLE "Historique" IS 'Historique des actions utilisateurs';

-- =============================================================================
-- 7. TABLE RESOURCE SHARE (partages)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "ResourceShare" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL,
    resource_type VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL,
    shared_with UUID NOT NULL,
    permission VARCHAR(50) DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT "ResourceShare_owner_id_fkey" 
        FOREIGN KEY (owner_id) REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT "ResourceShare_shared_with_fkey" 
        FOREIGN KEY (shared_with) REFERENCES "User"(id) ON DELETE CASCADE
);

COMMENT ON TABLE "ResourceShare" IS 'Partages de ressources entre utilisateurs';

-- =============================================================================
-- 8. TABLE APPVERSION (versions mobiles)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "AppVersion" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_name VARCHAR(255) NOT NULL,
    version_code INTEGER NOT NULL,
    platform VARCHAR(255) NOT NULL,
    download_url TEXT NOT NULL,
    notes TEXT,
    is_valid BOOLEAN DEFAULT true,
    is_beta BOOLEAN DEFAULT false,
    github_sha VARCHAR(255),
    github_run_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE "AppVersion" IS 'Versions de l application mobile';

-- =============================================================================
-- INDEX POUR LES PERFORMANCES
-- =============================================================================

-- Index sur User.email (déjà UNIQUE mais explicite)
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"(email);

-- Index sur Document.createdById
CREATE INDEX IF NOT EXISTS "idx_document_createdById" ON "Document"("createdById");
CREATE INDEX IF NOT EXISTS "idx_document_dossierId" ON "Document"("dossierId");
CREATE INDEX IF NOT EXISTS "idx_document_espaceId" ON "Document"("espaceId");

-- Index sur Dossier.espaceId
CREATE INDEX IF NOT EXISTS "idx_dossier_espaceId" ON "Dossier"("espaceId");

-- Index sur Espace.createdById
CREATE INDEX IF NOT EXISTS "idx_espace_createdById" ON "Espace"("createdById");

-- Index sur Historique
CREATE INDEX IF NOT EXISTS "idx_historique_userId" ON "Historique"("userId");
CREATE INDEX IF NOT EXISTS "idx_historique_docId" ON "Historique"("docId");
CREATE INDEX IF NOT EXISTS "idx_historique_created_at" ON "Historique"(created_at DESC);

-- Index sur EspaceUser
CREATE INDEX IF NOT EXISTS "idx_espaceUser_userId" ON "EspaceUser"("userId");
CREATE INDEX IF NOT EXISTS "idx_espaceUser_espaceId" ON "EspaceUser"("espaceId");

-- =============================================================================
-- FONCTION POUR METTRE À JOUR updated_at AUTOMATIQUEMENT
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_updated_at BEFORE UPDATE ON "Document"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dossier_updated_at BEFORE UPDATE ON "Dossier"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_espace_updated_at BEFORE UPDATE ON "Espace"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VÉRIFICATION FINALE
-- =============================================================================
SELECT 
    'User' as table_name, 
    COUNT(*) as column_count,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'User') as actual_columns
UNION ALL
SELECT 'Document', 16, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Document')
UNION ALL
SELECT 'Dossier', 8, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Dossier')
UNION ALL
SELECT 'Espace', 7, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Espace')
UNION ALL
SELECT 'EspaceUser', 5, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'EspaceUser')
UNION ALL
SELECT 'Historique', 8, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'Historique')
UNION ALL
SELECT 'ResourceShare', 7, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ResourceShare')
UNION ALL
SELECT 'AppVersion', 9, (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'AppVersion');
