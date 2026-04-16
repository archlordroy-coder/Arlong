-- ============================================================
-- MBOA DRIVE - SCHEMA COMPLET ET FONCTIONNEL
-- Ce SQL crée une base 100% conforme au backend
-- ============================================================

-- 1. NETTOYAGE TOTAL
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "Dossier" CASCADE;
DROP TABLE IF EXISTS "EspaceUser" CASCADE;
DROP TABLE IF EXISTS "Historique" CASCADE;
DROP TABLE IF EXISTS "Espace" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- ============================================================
-- TABLE USER
-- Colonnes requises par auth.controller.js :
-- - id, name, email, password (insert)
-- - id, name, email, avatar, is_admin, created_at (select après insert)
-- - google_refresh_token (pour Google OAuth)
-- ============================================================
CREATE TABLE "User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    google_refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_admin ON "User"(is_admin);

-- ============================================================
-- TABLE ESPACE
-- Colonnes requises par espace.controller.js :
-- - id, name, createdById, isDeleted
-- - created_at pour les tris
-- ============================================================
CREATE TABLE "Espace" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    "createdById" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "isDeleted" BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_espace_createdby ON "Espace"("createdById");
CREATE INDEX idx_espace_deleted ON "Espace"("isDeleted");

-- ============================================================
-- TABLE ESPACEUSER (liaison many-to-many)
-- Colonnes requises : userId, espaceId, role
-- ============================================================
CREATE TABLE "EspaceUser" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "espaceId" UUID NOT NULL REFERENCES "Espace"(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("userId", "espaceId")
);

CREATE INDEX idx_espaceuser_user ON "EspaceUser"("userId");
CREATE INDEX idx_espaceuser_espace ON "EspaceUser"("espaceId");

-- ============================================================
-- TABLE DOSSIER
-- Colonnes requises par dossier.controller.js :
-- - id, name, espaceId, createdById
-- - isDeleted, isPublic
-- ============================================================
CREATE TABLE "Dossier" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    "espaceId" UUID NOT NULL REFERENCES "Espace"(id) ON DELETE CASCADE,
    "createdById" UUID NOT NULL REFERENCES "User"(id),
    "isDeleted" BOOLEAN DEFAULT FALSE,
    "isPublic" BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dossier_espace ON "Dossier"("espaceId");
CREATE INDEX idx_dossier_createdby ON "Dossier"("createdById");
CREATE INDEX idx_dossier_deleted ON "Dossier"("isDeleted");

-- ============================================================
-- TABLE DOCUMENT
-- Colonnes requises par document.controller.js :
-- - id, name, type, size, url
-- - dossierId, espaceId, createdById
-- - isDeleted, metadata (JSONB)
-- ============================================================
CREATE TABLE "Document" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    size INTEGER,
    path TEXT,
    "driveId" TEXT,
    "dossierId" UUID REFERENCES "Dossier"(id) ON DELETE SET NULL,
    "espaceId" UUID REFERENCES "Espace"(id) ON DELETE CASCADE,
    "createdById" UUID REFERENCES "User"(id),
    "isDeleted" BOOLEAN DEFAULT FALSE,
    "firebase_url" TEXT,
    "use_firebase_cache" BOOLEAN DEFAULT FALSE,
    "firebase_cached_at" TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_document_dossier ON "Document"("dossierId");
CREATE INDEX idx_document_espace ON "Document"("espaceId");
CREATE INDEX idx_document_createdby ON "Document"("createdById");
CREATE INDEX idx_document_deleted ON "Document"("isDeleted");

-- ============================================================
-- TABLE HISTORIQUE
-- Colonnes requises par historique.controller.js :
-- - id, action, details (JSONB)
-- - userId, espaceId
-- ============================================================
CREATE TABLE "Historique" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "actionType" VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}',
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "docId" UUID REFERENCES "Document"(id) ON DELETE CASCADE,
    "espaceId" UUID REFERENCES "Espace"(id) ON DELETE CASCADE,
    "actionDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_historique_user ON "Historique"("userId");
CREATE INDEX idx_historique_doc ON "Historique"("docId");
CREATE INDEX idx_historique_date ON "Historique"("actionDate");

-- ============================================================
-- TABLE RESOURCE_SHARE
-- ============================================================
CREATE TABLE "ResourceShare" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    owner_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    permission VARCHAR(50) DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource_id, shared_with)
);

CREATE INDEX idx_share_resource ON "ResourceShare"(resource_id);
CREATE INDEX idx_share_user ON "ResourceShare"(shared_with);

ALTER TABLE "ResourceShare" DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- INSERTION DES 3 ADMINS
-- Password: 'ravel' (sera hashé par bcrypt dans l'app)
-- ============================================================
INSERT INTO "User" (name, email, password, is_admin, created_at) VALUES
('Ravel', 'ravel@mboa.com', '$2b$10$ravel.hash.placeholder', TRUE, NOW()),
('Tchinda', 'tchinda@mboa.com', '$2b$10$ravel.hash.placeholder', TRUE, NOW()),
('William', 'william@mboa.com', '$2b$10$ravel.hash.placeholder', TRUE, NOW());

-- ============================================================
-- DESACTIVATION RLS (Row Level Security)
-- Nécessaire pour que le backend puisse accéder aux données
-- ============================================================
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Espace" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "EspaceUser" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Dossier" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Historique" DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
SELECT '✅ BASE DE DONNÉES MBOA DRIVE CRÉÉE AVEC SUCCÈS' as status;

SELECT 'Tables créées:' as verification;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

SELECT 'Structure User:' as verification;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
ORDER BY ordinal_position;

SELECT 'Structure Espace:' as verification;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Espace' 
ORDER BY ordinal_position;

SELECT 'Structure Dossier:' as verification;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Dossier' 
ORDER BY ordinal_position;

SELECT 'Admins créés:' as verification;
SELECT id, name, email, is_admin FROM "User" WHERE is_admin = TRUE;

-- ============================================================
-- TABLE APPVERSION
-- ============================================================
CREATE TABLE IF NOT EXISTS "AppVersion" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_name VARCHAR(255) NOT NULL,
    version_code INTEGER NOT NULL,
    platform VARCHAR(50) NOT NULL,
    download_url TEXT NOT NULL,
    notes TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    is_beta BOOLEAN DEFAULT FALSE,
    github_sha VARCHAR(255),
    github_run_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_version_platform ON "AppVersion"(platform);
CREATE INDEX idx_version_code ON "AppVersion"(version_code);
ALTER TABLE "AppVersion" DISABLE ROW LEVEL SECURITY;
