import { useState, useEffect, type ChangeEvent, Fragment } from 'react';
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

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tempFiles, setTempFiles] = useState<File[]>([]);
  const [allEspaces, setAllEspaces] = useState<Espace[]>([]);
  const [espaceDossiers, setEspaceDossiers] = useState<Dossier[]>([]);
  const [selectedEspaceId, setSelectedEspaceId] = useState<string>("");
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);

  useEffect(() => {
    loadExplorerContent();
  }, [espaceId, dossierId, searchTerm, filterType]);

  const loadExplorerContent = async () => {
    try {
      setLoading(true);
      const newBreadcrumbs = [{ name: 'Mes Espaces', id: null, type: 'root' }];

      if (dossierId) {
        const res = await api.get(`/documents`, { params: { dossierId, search: searchTerm } });
        if (res.data.success) {
          setDocuments(res.data.data);
          const detail = res.data.data[0];
          if (detail && detail.dossier) {
            if (detail.dossier.espace) {
              newBreadcrumbs.push({ name: detail.dossier.espace.name, id: detail.dossier.espaceId, type: 'espace' });
            }
            newBreadcrumbs.push({ name: detail.dossier.name, id: detail.dossier.id, type: 'dossier' });
          }
          setCurrentScope('documents');
        }
      } else if (espaceId) {
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

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (dossierId) {
      setTempFiles(Array.from(files));
      const confirmed = window.confirm(`Voulez-vous importer ${files.length} fichier(s) dans le dossier actuel ?`);
      if (confirmed) {
        uploadFilesToDossier(Array.from(files), parseInt(dossierId));
      }
    } else {
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

    let dId = (selectedDossierId && selectedDossierId !== "root") ? parseInt(selectedDossierId) : 0;

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
    } else if (selectedDossierId === "root" || !selectedDossierId) {
      try {
        setIsSyncing(true);
        const dRes = await api.get(`/dossiers`, { params: { espaceId: selectedEspaceId } });
        let general = dRes.data.data.find((d: any) => d.name === "Général");
        if (!general) {
          const createRes = await api.post('/dossiers', { name: "Général", espaceId: parseInt(selectedEspaceId) });
          general = createRes.data.data;
        }
        dId = general.id;
      } catch (err) {
        alert("Erreur accès racine");
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
    loadExplorerContent();
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
    if (['jpg', 'jpeg', 'png', 'gif'].includes(t)) return <ImageIcon size={20} className="icon-blue" />;
    if (['pdf'].includes(t)) return <FileText size={20} className="icon-red" />;
    if (['doc', 'docx'].includes(t)) return <File size={20} className="icon-blue-dark" />;
    if (['txt', 'js', 'ts', 'css', 'html'].includes(t)) return <FileCode size={20} className="icon-green" />;
    return <File size={20} className="icon-gray" />;
  };

  return (
    <div className="explorer-container">
      <header className="explorer-header">
        <h1 className="explorer-title">Explorateur</h1>
        
        <nav className="breadcrumb-nav glass-panel">
          {breadcrumbs.map((crumb, idx) => (
            <Fragment key={`${crumb.type}-${crumb.id}-${idx}`}>
              <button 
                onClick={() => navigateTo(crumb.id, crumb.type)}
                className={`breadcrumb-btn ${idx === breadcrumbs.length - 1 ? 'is-active' : ''}`}
              >
                {crumb.name}
              </button>
              {idx < breadcrumbs.length - 1 && <span className="breadcrumb-separator">/</span>}
            </Fragment>
          ))}
        </nav>

        <div className="explorer-action-bar glass-panel">
          <div className="current-location">
            <Folder size={20} className="icon-primary" />
            <span className="location-name">{breadcrumbs[breadcrumbs.length - 1]?.name}</span>
          </div>
          <button 
            className="btn-import-here"
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
      </header>

      <div className="explorer-filters-bar glass-panel">
        <div className="search-box-wrap">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder={`Rechercher dans ${breadcrumbs[breadcrumbs.length-1]?.name}...`} 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {currentScope === 'documents' && (
          <div className="filter-select-wrap">
            <Filter size={18} className="filter-icon" />
            <select 
              className="filter-select"
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
        <div className="explorer-loader-wrapper">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="explorer-main-content">
          
          {currentScope === 'espaces' && (
            <div className="folder-grid">
              {espaces.map(esp => (
                <div key={esp.id} className="folder-card glass-panel" onClick={() => navigateTo(esp.id, 'espace')}>
                  <div className="folder-icon icon-bg-blue"><Folder size={40} /></div>
                  <div className="folder-name">{esp.name}</div>
                </div>
              ))}
            </div>
          )}

          {currentScope === 'dossiers' && (
            <div className="folder-grid">
              {dossiers.map(dos => (
                <div key={dos.id} className="folder-card glass-panel" onClick={() => navigateTo(dos.id, 'dossier')}>
                  <div className="folder-icon icon-bg-purple"><Folder size={40} /></div>
                  <div className="folder-name">{dos.name}</div>
                </div>
              ))}
              {dossiers.length === 0 && (
                <div className="empty-state">Cet espace est vide.</div>
              )}
            </div>
          )}

          {currentScope === 'documents' && (
            <div className="documents-list glass-panel">
              <div className="list-header">
                <div className="col-name">Nom</div>
                <div className="col-drive md-only">ID Drive</div>
                <div className="col-date md-only">Date</div>
                <div className="col-actions">Actions</div>
              </div>

              <div className="list-body">
                {documents.map(doc => (
                  <div key={doc.id} className="document-row">
                    <div className="doc-main-info">
                      <div className="doc-icon-box">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="doc-text-box">
                        <span className="doc-name">{doc.name}</span>
                        <span className="doc-date-mobile md-hidden">{format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                      </div>
                    </div>

                    <div className="doc-drive-id md-only">
                      {doc.driveId}
                    </div>

                    <div className="doc-date md-only">
                      {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                    </div>

                    <div className="doc-actions">
                      <a href={doc.path} target="_blank" rel="noreferrer" className="action-btn download">
                        <Download size={18} />
                      </a>
                      <button onClick={() => handleDelete(doc.id)} className="action-btn delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="empty-state">Aucun document dans ce dossier.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-wrap">
                <UploadCloud size={32} />
              </div>
              <h2 className="modal-title">Où archiver ces fichiers ?</h2>
            </div>

            <div className="modal-form">
              <div className="input-group">
                <label className="input-label">Espace de travail</label>
                <select 
                  className="input-select"
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
                  className="input-select"
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
                  <option value="root">Racine de l'espace</option>
                  {espaceDossiers.map(dos => (
                    <option key={dos.id} value={dos.id}>{dos.name}</option>
                  ))}
                  <option value="new">+ Créer un nouveau dossier</option>
                </select>
              </div>

              {showNewFolderInput && (
                <div className="input-group">
                  <label className="input-label highlight">Nom du nouveau dossier</label>
                  <input 
                    type="text" 
                    className="input-field-highlight"
                    placeholder="Nom du dossier..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div className="files-preview-list">
                <div className="preview-header">Fichiers ({tempFiles.length})</div>
                {tempFiles.map((f, i) => (
                  <div key={i} className="preview-item">
                    <File size={12} className="icon-primary" /> <span>{f.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowUploadModal(false)}>Annuler</button>
              <button className="btn-confirm" onClick={confirmUpload} disabled={isSyncing}>
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
