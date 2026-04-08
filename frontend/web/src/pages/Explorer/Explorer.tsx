import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { 
  File, FileText, Image as ImageIcon, FileCode,
  Download, Trash2, Search, Filter, Folder, UploadCloud
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './Explorer.css';

interface Espace {
  id: number;
  name: string;
}

interface Dossier {
  id: number;
  name: string;
  espaceId: number;
  espace?: Espace;
}

interface Document {
  id: number;
  name: string;
  type: string;
  path: string;
  driveId: string;
  dossierId: number;
  created_at: string;
  dossier: Dossier;
}

const Explorer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const espaceId = searchParams.get('espaceId');
  const dossierId = searchParams.get('dossierId');
  
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  
  const [currentScope, setCurrentScope] = useState<'espaces' | 'dossiers' | 'documents'>('espaces');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // États pour l'upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tempFiles, setTempFiles] = useState<File[]>([]);
  const [allEspaces, setAllEspaces] = useState<Espace[]>([]);
  const [espaceDossiers, setEspaceDossiers] = useState<Dossier[]>([]);
  const [selectedEspaceId, setSelectedEspaceId] = useState<string>("");
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Titres et fil d'ariane
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);

  useEffect(() => {
    loadExplorerContent();
  }, [espaceId, dossierId, searchTerm, filterType]);

  const loadExplorerContent = async () => {
    try {
      setLoading(true);
      const newBreadcrumbs = [{ name: 'Mes Espaces', id: null, type: 'root' }];

      if (dossierId) {
        // Mode Dossier: Voir les documents
        const res = await api.get(`/documents`, { params: { dossierId, search: searchTerm } });
        if (res.data.success) {
          setDocuments(res.data.data);
          const detail = res.data.data[0];
          if (detail) {
            newBreadcrumbs.push({ name: detail.dossier.espace.name, id: detail.dossier.espaceId, type: 'espace' });
            newBreadcrumbs.push({ name: detail.dossier.name, id: detail.dossier.id, type: 'dossier' });
          }
          setCurrentScope('documents');
        }
      } else if (espaceId) {
        // Mode Espace: Voir les dossiers
        const [espacesRes, dossiersRes] = await Promise.all([
          api.get('/espaces'),
          api.get('/dossiers', { params: { espaceId } })
        ]);
        
        if (espacesRes.data.success && dossiersRes.data.success) {
          const currentEspace = espacesRes.data.data.find((e: any) => e.id === parseInt(espaceId));
          if (currentEspace) {
            newBreadcrumbs.push({ name: currentEspace.name, id: currentEspace.id, type: 'espace' });
          }
          setDossiers(dossiersRes.data.data);
          setCurrentScope('dossiers');
        }
      } else {
        // Mode Racine: Voir les espaces
        const res = await api.get('/espaces');
        if (res.data.success) {
          setEspaces(res.data.data);
          setCurrentScope('espaces');
        }
      }
      setBreadcrumbs(newBreadcrumbs);
    } catch (error) {
      console.error('Explorer error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (dossierId) {
      // Si on est déjà dans un dossier, on upload direct après confirmation (pour éviter les erreurs)
      setTempFiles(Array.from(files));
      const confirmed = window.confirm(`Voulez-vous importer ${files.length} fichier(s) dans le dossier actuel ?`);
      if (confirmed) {
        uploadFilesToDossier(Array.from(files), parseInt(dossierId));
      }
    } else {
      // Sinon on ouvre la modale de sélection de destination
      setTempFiles(Array.from(files));
      try {
        const res = await api.get('/espaces');
        if (res.data.success) {
          setAllEspaces(res.data.data);
          if (res.data.data.length > 0) setSelectedEspaceId(res.data.data[0].id.toString());
        }
      } catch (err) { console.error(err); }
      setNewFolderName("");
      setShowNewFolderInput(false);
      setShowUploadModal(true);
    }
  };

  // Charger les dossiers quand l'espace change dans la modale
  useEffect(() => {
    if (selectedEspaceId && showUploadModal) {
      api.get(`/espaces/${selectedEspaceId}`).then(res => {
        if (res.data.success) {
          setEspaceDossiers(res.data.data.dossiers || []);
          if (res.data.data.dossiers?.length > 0) setSelectedDossierId(res.data.data.dossiers[0].id.toString());
        }
      });
    }
  }, [selectedEspaceId, showUploadModal]);

  const confirmUpload = async () => {
    if (!selectedDossierId && !showNewFolderInput) return alert("Choisissez un dossier");
    if (showNewFolderInput && !newFolderName.trim()) return alert("Saisissez un nom de dossier");

    let dId = selectedDossierId ? parseInt(selectedDossierId) : 0;

    if (showNewFolderInput) {
      try {
        setIsSyncing(true);
        const res = await api.post('/dossiers', { 
          name: newFolderName, 
          espaceId: parseInt(selectedEspaceId) 
        });
        if (res.data.success) {
          dId = res.data.data.id;
        }
      } catch (err) {
        alert("Erreur création dossier");
        setIsSyncing(false);
        return;
      }
    }

    await uploadFilesToDossier(tempFiles, dId);
    setShowUploadModal(false);
  };

  const uploadFilesToDossier = async (files: File[], dId: number) => {
    setIsSyncing(true);
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('dossierId', dId.toString());
        await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    setIsSyncing(false);
    loadExplorerContent(); // Rafraîchir
  };

  const navigateTo = (id: number | null, type: 'root' | 'espace' | 'dossier') => {
    if (type === 'root') setSearchParams({});
    if (type === 'espace') setSearchParams({ espaceId: id!.toString() });
    if (type === 'dossier') setSearchParams({ dossierId: id!.toString() });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
    try {
      const res = await api.delete(`/documents/${id}`);
      if (res.data.success) {
        setDocuments(documents.filter(d => d.id !== id));
      }
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(t)) return <ImageIcon size={20} className="text-blue-400" />;
    if (['pdf'].includes(t)) return <FileText size={20} className="text-red-400" />;
    if (['doc', 'docx'].includes(t)) return <File size={20} className="text-blue-500" />;
    if (['txt', 'js', 'ts', 'css', 'html'].includes(t)) return <FileCode size={20} className="text-green-400" />;
    return <File size={20} className="text-gray-400" />;
  };

  return (
    <div className="explorer-container animate-fade-in">
      {/* Header & Breadcrumbs */}
      <div className="explorer-header mb-6">
        <h1 className="text-3xl font-bold mb-4">Explorateur</h1>
        
        <nav className="flex items-center gap-2 text-sm text-secondary mb-4 bg-white/5 p-3 rounded-lg border border-white/5">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={`${crumb.type}-${crumb.id}-${idx}`}>
              <button 
                onClick={() => navigateTo(crumb.id, crumb.type)}
                className={`hover:text-primary transition-colors ${idx === breadcrumbs.length - 1 ? 'text-white font-bold' : ''}`}
              >
                {crumb.name}
              </button>
              {idx < breadcrumbs.length - 1 && <span className="opacity-30">/</span>}
            </React.Fragment>
          ))}
        </nav>

        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <Folder size={20} className="text-primary" />
            <span className="font-bold">{breadcrumbs[breadcrumbs.length - 1]?.name}</span>
          </div>
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={() => document.getElementById('explorer-upload')?.click()}
          >
            <UploadCloud size={18} />
            <span>Importer ici</span>
          </button>
          <input 
            type="file" 
            id="explorer-upload" 
            multiple 
            hidden 
            onChange={(e) => handleFileUpload(e)} 
          />
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="filters-container glass-panel mb-8 flex flex-wrap gap-4 items-center">
        <div className="search-box flex-1 min-w-[200px] flex items-center gap-2 px-4 py-2 bg-black/20 rounded-lg">
          <Search size={18} className="text-secondary" />
          <input 
            type="text" 
            placeholder={`Rechercher dans ${breadcrumbs[breadcrumbs.length-1]?.name}...`} 
            className="bg-transparent border-none outline-none text-white w-full text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {currentScope === 'documents' && (
          <div className="filter-item flex items-center gap-2">
            <Filter size={18} className="text-secondary" />
            <select 
              className="bg-black/20 text-white border-none rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="pdf">PDF</option>
              <option value="image">Images</option>
              <option value="doc">Documents</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="explorer-content">
          
          {/* VUE ESPACES */}
          {currentScope === 'espaces' && (
            <div className="folder-grid">
              {espaces.map(esp => (
                <div key={esp.id} className="folder-card glass-panel hover:scale-105 transition-all cursor-pointer" onClick={() => navigateTo(esp.id, 'espace')}>
                  <div className="folder-icon blue"><Folder size={40} /></div>
                  <div className="folder-name">{esp.name}</div>
                </div>
              ))}
            </div>
          )}

          {/* VUE DOSSIERS */}
          {currentScope === 'dossiers' && (
            <div className="folder-grid">
              {dossiers.map(dos => (
                <div key={dos.id} className="folder-card glass-panel hover:scale-105 transition-all cursor-pointer" onClick={() => navigateTo(dos.id, 'dossier')}>
                  <div className="folder-icon purple"><Folder size={40} /></div>
                  <div className="folder-name">{dos.name}</div>
                </div>
              ))}
              {dossiers.length === 0 && (
                <div className="col-span-full py-20 text-center text-secondary">Cet espace est vide.</div>
              )}
            </div>
          )}

          {/* VUE DOCUMENTS */}
          {currentScope === 'documents' && (
            <div className="documents-list-container glass-panel">
              <div className="document-grid-header border-b border-white/5 pb-4 px-4 text-xs font-bold text-secondary uppercase tracking-wider hidden md:grid grid-cols-[1fr_200px_180px_100px]">
                <div>Nom</div>
                <div>ID Drive</div>
                <div>Date</div>
                <div className="text-right">Actions</div>
              </div>

              <div className="document-rows">
                {documents.map(doc => (
                  <div key={doc.id} className="document-row grid md:grid-cols-[1fr_200px_180px_100px] items-center p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                    <div className="flex items-center gap-3">
                      <div className="doc-icon-wrapper p-2 rounded-lg bg-white/5">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="doc-name font-medium text-white truncate max-w-[250px]">{doc.name}</span>
                        <span className="md:hidden text-xs text-secondary">{format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 text-xs text-secondary opacity-50 truncate">
                      {doc.driveId}
                    </div>

                    <div className="hidden md:block text-sm text-secondary">
                      {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                    </div>

                    <div className="flex justify-end gap-2">
                      <a href={doc.path} target="_blank" rel="noreferrer" className="btn btn-ghost p-2 text-secondary hover:text-primary transition-colors">
                        <Download size={18} />
                      </a>
                      <button onClick={() => handleDelete(doc.id)} className="btn btn-ghost p-2 text-secondary hover:text-red-400 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="py-20 text-center text-secondary">Aucun document dans ce dossier.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Modale Destination d'Upload (similaire au Dashboard) */}
      {showUploadModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content glass-panel max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold">Où archiver ces fichiers ?</h2>
            </div>

            <div className="space-y-4 mb-8">
              <div className="input-group">
                <label className="input-label">Espace de travail</label>
                <select 
                  className="input-field bg-black/40"
                  value={selectedEspaceId}
                  onChange={(e) => setSelectedEspaceId(e.target.value)}
                >
                  {allEspaces.map(esp => (
                    <option key={esp.id} value={esp.id}>{esp.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Dossier de destination</label>
                <select 
                  className="input-field bg-black/40"
                  value={showNewFolderInput ? "new" : selectedDossierId}
                  onChange={(e) => {
                    if (e.target.value === "new") {
                      setShowNewFolderInput(true);
                      setSelectedDossierId("");
                    } else {
                      setShowNewFolderInput(false);
                      setSelectedDossierId(e.target.value);
                    }
                  }}
                >
                  {espaceDossiers.map(dos => (
                    <option key={dos.id} value={dos.id}>{dos.name}</option>
                  ))}
                  <option value="new">+ Créer un nouveau dossier</option>
                </select>
              </div>

              {showNewFolderInput && (
                <div className="input-group animate-slide-down">
                  <label className="input-label font-bold text-primary">Nom du nouveau dossier</label>
                  <input 
                    type="text" 
                    className="input-field bg-primary/5 border-primary/20 focus:border-primary"
                    placeholder="Nom du dossier..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div className="bg-white/5 p-3 rounded-lg max-h-32 overflow-y-auto">
                <div className="text-xs font-bold text-secondary uppercase mb-2">Fichiers ({tempFiles.length})</div>
                {tempFiles.map((f, i) => (
                  <div key={i} className="text-xs truncate flex items-center gap-2 mb-1">
                    <File size={12} className="text-primary" /> {f.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button className="btn btn-secondary flex-1" onClick={() => setShowUploadModal(false)}>Annuler</button>
              <button className="btn btn-primary flex-1" onClick={confirmUpload} disabled={isSyncing}>
                {isSyncing ? "Envoi..." : "Confirmer l'archivage"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explorer;
