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
DROP TABLE IF EXISTS "ResourceShare" CASCADE;
DROP TABLE IF EXISTS "AppVersion" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- ============================================================
-- TABLE USER
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

CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_admin ON "User"(is_admin);

-- ============================================================
-- TABLE ESPACE
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
-- TABLE ESPACEUSER
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

-- ============================================================
-- TABLE APPVERSION
-- ============================================================
CREATE TABLE "AppVersion" (
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

-- ============================================================
-- DESACTIVATION RLS (Row Level Security)
-- ============================================================
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Espace" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "EspaceUser" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Dossier" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Historique" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ResourceShare" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AppVersion" DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- INSERTION DES 3 ADMINS (Password placeholder)
-- ============================================================
INSERT INTO "User" (name, email, password, is_admin) VALUES
('Ravel', 'ravel@mboa.com', '$2b$10$ravel.hash.placeholder', TRUE),
('Tchinda', 'tchinda@mboa.com', '$2b$10$ravel.hash.placeholder', TRUE),
('William', 'william@mboa.com', '$2b$10$ravel.hash.placeholder', TRUE);

SELECT '✅ BASE DE DONNÉES MBOA DRIVE CRÉÉE AVEC SUCCÈS' as status;
