-- Table pour la gestion des versions
CREATE TABLE IF NOT EXISTS "AppVersion" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_name TEXT NOT NULL,
    version_code INTEGER NOT NULL,
    platform TEXT NOT NULL, -- 'desktop', 'web', 'mobile'
    download_url TEXT NOT NULL,
    notes TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour le partage de ressources
CREATE TABLE IF NOT EXISTS "ResourceShare" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id INTEGER NOT NULL, -- Correspond à l'ID Serial de Dossier ou Espace
    resource_type TEXT CHECK (resource_type IN ('folder','space')),
    owner_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES "User"(id) ON DELETE CASCADE,
    permission TEXT CHECK (permission IN ('view','edit','admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (resource_id, shared_with, resource_type)
);

-- Table pour les listes de contacts
CREATE TABLE IF NOT EXISTS "ContactList" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contacts JSONB NOT NULL,
    source_file TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajout des colonnes de cache Firebase à la table Document
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS firebase_url TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS firebase_cached_at TIMESTAMPTZ;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS use_firebase_cache BOOLEAN DEFAULT FALSE;

-- Index pour la récupération rapide
CREATE INDEX IF NOT EXISTS idx_documents_firebase ON "Document"(firebase_url) WHERE firebase_url IS NOT NULL;
