import { useState, useEffect, useRef, type ChangeEvent, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { 
  File, Download, Trash2, Search, Filter, Folder, UploadCloud,
  MoreVertical, Eye, Pencil, X, Check, Loader2, Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SkeletonCard } from '../../components/Common/Skeleton';
import './Explorer.css';

import pdfIcon from '../../assets/pdf.png';
import docIcon from '../../assets/doc.png';
import imgIcon from '../../assets/img.png';
import mdIcon from '../../assets/md.png';
import zipIcon from '../../assets/zip.png';
import rarIcon from '../../assets/rar.png';
import pptIcon from '../../assets/ppt.png';
import xlsxIcon from '../../assets/xlsx.png';
import textIcon from '../../assets/text.png';

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
  size?: number;
  dossierId: number;
  created_at: string;
  dossier: Dossier;
}

const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

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
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<Document | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Document | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<Document | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);

  // Folder states
  const [folderMenuId, setFolderMenuId] = useState<number | null>(null);
  const [showFolderRenameModal, setShowFolderRenameModal] = useState<Dossier | null>(null);
  const [showFolderDeleteModal, setShowFolderDeleteModal] = useState<Dossier | null>(null);
  const [folderDocCount, setFolderDocCount] = useState<number>(0);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
      if (folderMenuRef.current && !folderMenuRef.current.contains(event.target as Node)) {
        setFolderMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadExplorerContent();
  }, [espaceId, dossierId, searchTerm, filterType]);

  const loadExplorerContent = async () => {
    try {
      setLoading(true);
      const newBreadcrumbs = [{ name: 'Mes Espaces', id: null, type: 'root' }];

      if (dossierId) {
        const [docsRes, dossierRes] = await Promise.all([
          api.get(`/documents`, { params: { dossierId, search: searchTerm } }),
          api.get(`/dossiers/${dossierId}`)
        ]);

        if (docsRes.data.success) {
          let docs = docsRes.data.data;
          if (filterType !== 'all') {
            docs = docs.filter((d: Document) => d.type.toLowerCase().includes(filterType));
          }
          setDocuments(docs);
          setCurrentScope('documents');
        }

        if (dossierRes.data.success) {
          const dossier = dossierRes.data.data;
          if (dossier.espace) {
            newBreadcrumbs.push({ name: dossier.espace.name, id: dossier.espaceId, type: 'espace' });
          }
          newBreadcrumbs.push({ name: dossier.name, id: dossier.id, type: 'dossier' });
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

  const handleRename = async () => {
    if (!showRenameModal || !renameValue.trim()) return;
    setIsRenaming(true);
    try {
      const res = await api.put(`/documents/${showRenameModal.id}`, { name: renameValue.trim() });
      if (res.data.success) {
        setDocuments(documents.map(d => d.id === showRenameModal.id ? { ...d, name: renameValue.trim() } : d));
        setShowRenameModal(null);
      }
    } catch (error) {
      alert('Erreur lors du renommage');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/documents/${showDeleteModal.id}`);
      if (res.data.success) {
        setDocuments(documents.filter(d => d.id !== showDeleteModal.id));
        setShowDeleteModal(null);
      }
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = async (doc: Document) => {
    const isImage = IMAGE_TYPES.includes(doc.type.toLowerCase());

    if (isImage) {
      setShowPreviewModal(doc);
      setIsLoadingPreview(true);
      setPreviewImage(null);

      try {
        const response = await api.get(`/documents/${doc.id}/download`, {
          responseType: 'blob',
        });
        const imageUrl = URL.createObjectURL(response.data);
        setPreviewImage(imageUrl);
      } catch (error) {
        console.error('Erreur chargement image:', error);
        alert('Impossible de charger l\'image');
      } finally {
        setIsLoadingPreview(false);
      }
    } else {
      window.open(doc.path, '_blank');
    }
    setActiveMenu(null);
  };

  const handleDownload = async (doc: Document) => {
    setIsDownloading(doc.id);
    setActiveMenu(null);

    try {
      const response = await api.get(`/documents/${doc.id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement');
    } finally {
      setIsDownloading(null);
    }
  };

  const isImageFile = (type: string) => IMAGE_TYPES.includes(type.toLowerCase());

  // Folder handlers
  const handleFolderMenuClick = async (dos: Dossier, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderMenuId(folderMenuId === dos.id ? null : dos.id);

    // Check document count in folder
    if (folderMenuId !== dos.id) {
      try {
        const res = await api.get(`/documents`, { params: { dossierId: dos.id } });
        if (res.data.success) {
          setFolderDocCount(res.data.data.length);
        }
      } catch {
        setFolderDocCount(0);
      }
    }
  };

  const openFolderRename = (dos: Dossier) => {
    setRenameValue(dos.name);
    setShowFolderRenameModal(dos);
    setFolderMenuId(null);
  };

  const handleFolderRename = async () => {
    if (!showFolderRenameModal || !renameValue.trim()) return;
    setIsRenamingFolder(true);
    try {
      const res = await api.put(`/dossiers/${showFolderRenameModal.id}`, { name: renameValue.trim() });
      if (res.data.success) {
        setDossiers(dossiers.map(d => d.id === showFolderRenameModal.id ? { ...d, name: renameValue.trim() } : d));
        setShowFolderRenameModal(null);
        setRenameValue('');
      }
    } catch {
      alert('Erreur lors du renommage');
    } finally {
      setIsRenamingFolder(false);
    }
  };

  const openFolderDelete = async (dos: Dossier) => {
    setFolderMenuId(null);
    try {
      const res = await api.get(`/documents`, { params: { dossierId: dos.id } });
      if (res.data.success) {
        setFolderDocCount(res.data.data.length);
      }
    } catch {
      setFolderDocCount(0);
    }
    setShowFolderDeleteModal(dos);
  };

  const handleFolderDelete = async () => {
    if (!showFolderDeleteModal) return;
    setIsDeletingFolder(true);
    try {
      const res = await api.delete(`/dossiers/${showFolderDeleteModal.id}`);
      if (res.data.success) {
        setDossiers(dossiers.filter(d => d.id !== showFolderDeleteModal.id));
        setShowFolderDeleteModal(null);
      }
    } catch {
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeletingFolder(false);
    }
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return <img src={pdfIcon} alt="PDF" className="file-type-icon" />;
    if (t === 'doc' || t === 'docx') return <img src={docIcon} alt="Word" className="file-type-icon" />;
    if (t === 'md') return <img src={mdIcon} alt="Markdown" className="file-type-icon" />;
    if (t === 'txt' || t === 'js' || t === 'ts' || t === 'css' || t === 'html') return <img src={textIcon} alt="Text" className="file-type-icon" />;
    if (t === 'zip' || t === 'rar' || t === '7z' || t === 'tar' || t === 'gz') return <img src={t === 'rar' || t === '7z' ? rarIcon : zipIcon} alt="Archive" className="file-type-icon" />;
    if (t === 'ppt' || t === 'pptx') return <img src={pptIcon} alt="PowerPoint" className="file-type-icon" />;
    if (t === 'xls' || t === 'xlsx' || t === 'csv') return <img src={xlsxIcon} alt="Excel" className="file-type-icon" />;
    if (isImageFile(t)) return <img src={imgIcon} alt="Image" className="file-type-icon" />;
    return <File size={32} className="icon-gray" />;
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
            <span>Importer</span>
          </button>
          <input 
            type="file" 
            id="explorer-upload" 
            multiple 
            accept="image/*,.pdf,.doc,.docx,.txt,.md,.zip,.ppt,.pptx,.xls,.xlsx"
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
              <option value="all">Tous</option>
              <option value="pdf">PDF</option>
              <option value="image">Images</option>
              <option value="doc">Documents</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="explorer-main-content">
          {currentScope === 'espaces' && (
            <div className="folder-grid">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
          {currentScope === 'dossiers' && (
            <div className="folder-grid">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
          {currentScope === 'documents' && (
            <div className="doc-grid">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
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
                <div key={dos.id} className={`folder-card glass-panel ${folderMenuId === dos.id ? 'menu-active' : ''}`}>
                  <div className="folder-card-main" onClick={() => navigateTo(dos.id, 'dossier')}>
                    <div className="folder-icon icon-bg-purple"><Folder size={40} /></div>
                    <div className="folder-name">{dos.name}</div>
                  </div>
                  <button
                    className="folder-menu-btn"
                    onClick={(e) => handleFolderMenuClick(dos, e)}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {folderMenuId === dos.id && (
                    <div className="folder-options-menu glass-panel" ref={folderMenuRef}>
                      <button className="folder-option" onClick={() => openFolderRename(dos)}>
                        <Pencil size={16} />
                        <span>Renommer</span>
                      </button>
                      <button className="folder-option danger" onClick={() => openFolderDelete(dos)}>
                        <Trash2 size={16} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {dossiers.length === 0 && (
                <div className="empty-state-full">
                  <Folder size={48} />
                  <p>Cet espace est vide.</p>
                </div>
              )}
            </div>
          )}

          {currentScope === 'documents' && (
            <div className="doc-grid">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`doc-card glass-panel ${activeMenu === doc.id ? 'active' : ''}`}
                >
                  <div
                    className="doc-card-preview"
                    onClick={() => isImageFile(doc.type) && handlePreview(doc)}
                  >
                    {isImageFile(doc.type) ? (
                      <img
                        className="doc-image-display"
                        src={doc.path}
                        alt={doc.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className="doc-file-preview">
                        <div className="doc-type-badge">{doc.type.toUpperCase()}</div>
                        {getFileIcon(doc.type)}
                      </div>
                    )}
                  </div>
                  <div className="doc-card-info">
                    <span className="doc-card-name" title={doc.name}>{doc.name}</span>
                    <span className="doc-card-meta">
                      {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="doc-card-actions">
                    <button
                      className="doc-menu-btn"
                      onClick={() => setActiveMenu(activeMenu === doc.id ? null : doc.id)}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {activeMenu === doc.id && (
                      <div className="doc-options-menu glass-panel" ref={menuRef}>
                        <button className="doc-option" onClick={() => handlePreview(doc)}>
                          <Eye size={16} />
                          <span>{isImageFile(doc.type) ? 'Aperçu' : 'Ouvrir'}</span>
                        </button>
                        <button className="doc-option" onClick={() => {
                          setRenameValue(doc.name);
                          setShowRenameModal(doc);
                          setActiveMenu(null);
                        }}>
                          <Pencil size={16} />
                          <span>Renommer</span>
                        </button>
                        <button
                          className="doc-option"
                          onClick={() => handleDownload(doc)}
                          disabled={isDownloading === doc.id}
                        >
                          {isDownloading === doc.id ? (
                            <Loader2 size={16} className="spin" />
                          ) : (
                            <Download size={16} />
                          )}
                          <span>{isDownloading === doc.id ? 'Téléchargement...' : 'Télécharger'}</span>
                        </button>
                        <button className="doc-option danger" onClick={() => {
                          setShowDeleteModal(doc);
                          setActiveMenu(null);
                        }}>
                          <Trash2 size={16} />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="empty-state-full">
                  <File size={48} />
                  <p>Aucun document dans ce dossier.</p>
                </div>
              )}
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
                {isSyncing ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Renommage Fichier */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(null)}>
          <div className="rename-modal" onClick={e => e.stopPropagation()}>
            <div className="rename-header">
              <h3>Renommer le fichier</h3>
              <button className="modal-close-btn" onClick={() => setShowRenameModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="rename-preview">
              {getFileIcon(showRenameModal.type)}
              <span>{showRenameModal.name}</span>
            </div>
            <input
              type="text"
              className="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <div className="rename-actions">
              <button className="btn-cancel" onClick={() => setShowRenameModal(null)}>Annuler</button>
              <button
                className="btn-confirm"
                onClick={handleRename}
                disabled={isRenaming || !renameValue.trim() || renameValue === showRenameModal.name}
              >
                {isRenaming ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression Fichier */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !isDeleting && setShowDeleteModal(null)}>
          <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <Trash2 size={32} />
            </div>
            <h3>Supprimer ce fichier ?</h3>
            <p><strong>"{showDeleteModal.name}"</strong> sera définitivement supprimé.</p>
            <div className="delete-confirm-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteModal(null)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                className="btn-delete-confirm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="spinner" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Renommage Dossier */}
      {showFolderRenameModal && (
        <div className="modal-overlay" onClick={() => setShowFolderRenameModal(null)}>
          <div className="rename-modal" onClick={e => e.stopPropagation()}>
            <div className="rename-header">
              <h3>Renommer le dossier</h3>
              <button className="modal-close-btn" onClick={() => setShowFolderRenameModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="rename-preview">
              <Folder size={32} className="icon-purple" />
              <span>{showFolderRenameModal.name}</span>
            </div>
            <input
              type="text"
              className="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleFolderRename()}
            />
            <div className="rename-actions">
              <button className="btn-cancel" onClick={() => setShowFolderRenameModal(null)}>Annuler</button>
              <button
                className="btn-confirm"
                onClick={handleFolderRename}
                disabled={isRenamingFolder || !renameValue.trim() || renameValue === showFolderRenameModal.name}
              >
                {isRenamingFolder ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression Dossier */}
      {showFolderDeleteModal && (
        <div className="modal-overlay" onClick={() => !isDeletingFolder && setShowFolderDeleteModal(null)}>
          <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-icon warning">
              <Trash2 size={32} />
            </div>
            <h3>Supprimer ce dossier ?</h3>
            <p>
              <strong>"{showFolderDeleteModal.name}"</strong> et tous ses fichiers
              {folderDocCount > 0 && <span className="text-warning"> ({folderDocCount} fichier(s))</span>}
              seront définitivement supprimés.
            </p>
            <div className="delete-confirm-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowFolderDeleteModal(null)}
                disabled={isDeletingFolder}
              >
                Annuler
              </button>
              <button
                className="btn-delete-confirm"
                onClick={handleFolderDelete}
                disabled={isDeletingFolder}
              >
                {isDeletingFolder ? (
                  <>
                    <div className="spinner" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aperçu Image */}
      {showPreviewModal && (
        <div className="preview-modal-overlay" onClick={() => {
          setShowPreviewModal(null);
          if (previewImage) URL.revokeObjectURL(previewImage);
          setPreviewImage(null);
        }}>
          <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
            <div className="preview-modal-header">
              <span className="preview-modal-title">{showPreviewModal.name}</span>
              <button
                className="preview-modal-close"
                onClick={() => {
                  setShowPreviewModal(null);
                  if (previewImage) URL.revokeObjectURL(previewImage);
                  setPreviewImage(null);
                }}
              >
                <X size={24} />
              </button>
            </div>
            <div className="preview-modal-body">
              {isLoadingPreview ? (
                <div className="preview-loading">
                  <Loader2 size={40} className="spin" />
                  <span>Chargement...</span>
                </div>
              ) : previewImage ? (
                <img src={previewImage} alt={showPreviewModal.name} className="preview-image" />
              ) : (
                <div className="preview-error">
                  <ImageIcon size={48} />
                  <span>Impossible de charger l'image</span>
                </div>
              )}
            </div>
            <div className="preview-modal-footer">
              <button
                className="preview-download-btn"
                onClick={() => handleDownload(showPreviewModal)}
                disabled={isDownloading === showPreviewModal.id}
              >
                {isDownloading === showPreviewModal.id ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <Download size={18} />
                )}
                <span>Télécharger</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explorer;
