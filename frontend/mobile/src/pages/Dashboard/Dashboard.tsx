import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import localforage from 'localforage';
import { 
  UploadCloud, Folder, File, WifiOff, RefreshCw, CheckCircle, Clock,
  TrendingUp, Activity, Trash2, Download, Import, Eye, ChevronRight
} from 'lucide-react';
import { SkeletonStatCard, SkeletonListItem } from '../../components/Common/Skeleton';
import './Dashboard.css';

interface OfflineFile {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  dossierId: number;
  timestamp: number;
}

interface HistoryItem {
  id: number;
  actionType: string;
  docId: number | null;
  created_at: string;
  document: { name: string; type: string } | null;
  user: { name: string };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineFile[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [stats, setStats] = useState({ espaces: 0, dossiers: 0, documents: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tempFiles, setTempFiles] = useState<globalThis.File[]>([]);
  const [allEspaces, setAllEspaces] = useState<any[]>([]);
  const [selectedEspaceId, setSelectedEspaceId] = useState<string>("");
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [espaceDossiers, setEspaceDossiers] = useState<any[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const loadQueue = async () => {
      const queue = await localforage.getItem<OfflineFile[]>('arlong_offline_docs') || [];
      setOfflineQueue(queue);
    };
    loadQueue();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && !isSyncing && user?.googleRefreshToken) {
      syncOfflineFiles();
    }
  }, [isOnline, offlineQueue, user]);

  const fetchAllData = async () => {
    setIsLoadingStats(true);
    setIsLoadingDocs(true);
    setIsLoadingHistory(true);
    
    try {
      const [statsRes, docsRes, historyRes] = await Promise.all([
        api.get('/espaces/stats'),
        api.get('/documents', { params: { limit: 3 } }),
        api.get('/historique', { params: { limit: 3 } })
      ]);
      
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (docsRes.data.success) setRecentDocs(docsRes.data.data.slice(0, 3));
      if (historyRes.data.success) setHistory(historyRes.data.data.slice(0, 3));
    } catch (error) {
      console.error("Échec du chargement:", error);
    } finally {
      setIsLoadingStats(false);
      setIsLoadingDocs(false);
      setIsLoadingHistory(false);
    }
  };

  const syncOfflineFiles = async () => {
    setIsSyncing(true);
    const queue = [...offlineQueue];
    const newQueue = [...queue];

    for (const file of queue) {
      try {
        const formData = new FormData();
        formData.append('file', file.blob, file.name);
        formData.append('dossierId', file.dossierId.toString());

        await api.post('/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const index = newQueue.findIndex(f => f.id === file.id);
        if (index > -1) newQueue.splice(index, 1);
        
      } catch (error) {
        console.error("Échec de synchro pour", file.name);
      }
    }

    await localforage.setItem('arlong_offline_docs', newQueue);
    setOfflineQueue(newQueue);
    setIsSyncing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();
    
    let uploadedFiles: FileList | null = null;
    
    if ('dataTransfer' in e) {
      uploadedFiles = e.dataTransfer.files;
    } else if ('target' in e && e.target.files) {
      uploadedFiles = (e.target as HTMLInputElement).files;
    }

    if (!uploadedFiles || uploadedFiles.length === 0) return;

    try {
      const res = await api.get('/espaces');
      if (res.data.success) {
        setAllEspaces(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedEspaceId(res.data.data[0].id.toString());
        }
      }
    } catch (err) {
      console.error("Erreur espaces", err);
    }

    setTempFiles(Array.from(uploadedFiles));
    setNewFolderName("");
    setShowNewFolderInput(false);
    setShowUploadModal(true);
  };

  useEffect(() => {
    if (selectedEspaceId) {
      const fetchDossiers = async () => {
        try {
          const res = await api.get(`/espaces/${selectedEspaceId}`);
          if (res.data.success) {
            setEspaceDossiers(res.data.data.dossiers || []);
            if (res.data.data.dossiers?.length > 0) {
              setSelectedDossierId(res.data.data.dossiers[0].id.toString());
            }
          }
        } catch (e) {
          console.error("Erreur dossiers", e);
        }
      };
      fetchDossiers();
    }
  }, [selectedEspaceId]);

  const confirmUpload = async () => {
    setShowUploadModal(false);
    let DOSSIER_ID = (selectedDossierId && selectedDossierId !== "root") ? parseInt(selectedDossierId) : 0;

    if (showNewFolderInput) {
      try {
        setIsSyncing(true);
        const res = await api.post('/dossiers', { 
          name: newFolderName, 
          espaceId: parseInt(selectedEspaceId) 
        });
        if (res.data.success) {
          DOSSIER_ID = res.data.data.id;
        } else {
          throw new Error("Erreur");
        }
      } catch (err) {
        alert("Impossible de créer le dossier.");
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
        DOSSIER_ID = general.id;
      } catch (err) {
        alert("Erreur accès racine.");
        setIsSyncing(false);
        return;
      }
    }

    for (let i = 0; i < tempFiles.length; i++) {
      const file = tempFiles[i];

      if (!isOnline || !user?.googleRefreshToken) {
        const offlineFile: OfflineFile = {
          id: Date.now().toString() + i,
          name: file.name,
          type: file.type,
          blob: file,
          dossierId: DOSSIER_ID,
          timestamp: Date.now()
        };
        const updatedQueue = [...offlineQueue, offlineFile];
        setOfflineQueue(updatedQueue);
        await localforage.setItem('arlong_offline_docs', updatedQueue);
        alert(`💾 Mode Hors-ligne : "${file.name}" enregistré localement.`);
      } else {
        try {
          setIsSyncing(true);
          const formData = new FormData();
          formData.append('file', file);
          formData.append('dossierId', DOSSIER_ID.toString());
          
          await api.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          fetchAllData();
        } catch (error: any) {
          console.error('Upload failed:', error);
          alert(`❌ Échec d'envoi pour ${file.name}`);
        } finally {
          setIsSyncing(false);
        }
      }
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'Importation': return <Import size={14} className="action-icon import" />;
      case 'Consultation': return <Eye size={14} className="action-icon view" />;
      case 'Téléchargement': return <Download size={14} className="action-icon download" />;
      case 'Suppression': return <Trash2 size={14} className="action-icon delete" />;
      default: return <Activity size={14} className="action-icon default" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="mobile-dashboard">
      <header className="mobile-dashboard-header">
        <div className="mobile-dashboard-welcome">
          <h1 className="mobile-dashboard-title">Bonjour, {user?.name}</h1>
          <p className="mobile-dashboard-subtitle">Voici un aperçu de vos archives</p>
        </div>
        <button className="refresh-btn" onClick={fetchAllData}>
          <RefreshCw size={18} />
        </button>
      </header>

      {/* Stats Cards */}
      <div className="mobile-dashboard-stats">
        {isLoadingStats ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <div className="mobile-stat-card">
              <div className="mobile-stat-icon blue">
                <Folder size={20} />
              </div>
              <div className="mobile-stat-number">{stats.espaces}</div>
              <div className="mobile-stat-label">Espaces</div>
            </div>
            <div className="mobile-stat-card">
              <div className="mobile-stat-icon purple">
                <TrendingUp size={20} />
              </div>
              <div className="mobile-stat-number">{stats.dossiers}</div>
              <div className="mobile-stat-label">Dossiers</div>
            </div>
            <div className="mobile-stat-card">
              <div className="mobile-stat-icon green">
                <File size={20} />
              </div>
              <div className="mobile-stat-number">{stats.documents}</div>
              <div className="mobile-stat-label">Fichiers</div>
            </div>
          </>
        )}
      </div>

      {/* Upload Action */}
      <div className="mobile-upload-action">
        <input 
          type="file" 
          id="mobile-file-upload" 
          multiple 
          className="hidden" 
          onChange={handleFileUpload} 
        />
        <label htmlFor="mobile-file-upload" className="mobile-upload-btn">
          <UploadCloud size={24} />
          <span>Importer un fichier</span>
        </label>
      </div>

      {/* Sync Banner */}
      {offlineQueue.length > 0 && (
        <div className="mobile-sync-banner">
          {!isOnline ? (
            <>
              <WifiOff size={18} className="text-warning" />
              <span>{offlineQueue.length} fichier(s) en attente</span>
            </>
          ) : !user?.googleRefreshToken ? (
            <>
              <WifiOff size={18} className="text-warning" />
              <span>{offlineQueue.length} fichier(s): Liez Drive</span>
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw size={18} className="text-primary spin" />
              <span>Synchro en cours...</span>
            </>
          ) : (
            <>
              <CheckCircle size={18} className="text-success" />
              <span>Prêt à synchroniser</span>
            </>
          )}
        </div>
      )}

      {/* Recent Documents */}
      <div className="mobile-dashboard-section">
        <div className="mobile-section-header">
          <h2 className="mobile-section-title">
            <Clock size={18} />
            Documents récents
          </h2>
          <a href="/explorer" className="mobile-section-link">
            Voir tout <ChevronRight size={16} />
          </a>
        </div>
        
        <div className="mobile-recent-list border-glass">
          {isLoadingDocs ? (
            <>
              <SkeletonListItem />
              <SkeletonListItem />
              <SkeletonListItem />
            </>
          ) : recentDocs.length > 0 ? (
            recentDocs.map((doc) => (
              <div key={doc.id} className="mobile-recent-item">
                <div className="mobile-recent-icon">
                  <File size={16} />
                </div>
                <div className="mobile-recent-info">
                  <div className="mobile-recent-name">{doc.name}</div>
                  <div className="mobile-recent-meta">{doc.dossier?.name || 'Général'}</div>
                </div>
                <div className="mobile-recent-date">
                  {new Date(doc.created_at).toLocaleDateString('fr-FR', { 
                    day: '2-digit', month: 'short' 
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="mobile-recent-empty">
              <File size={32} />
              <p>Aucune archive récente</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity History */}
      <div className="mobile-dashboard-section">
        <div className="mobile-section-header">
          <h2 className="mobile-section-title">
            <Activity size={18} />
            Activité récente
          </h2>
          <a href="/history" className="mobile-section-link">
            Voir tout <ChevronRight size={16} />
          </a>
        </div>
        
        <div className="mobile-activity-list border-glass">
          {isLoadingHistory ? (
            <>
              <SkeletonListItem />
              <SkeletonListItem />
            </>
          ) : history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="mobile-activity-item">
                <div className="mobile-activity-icon">
                  {getActionIcon(item.actionType)}
                </div>
                <div className="mobile-activity-content">
                  <div className="mobile-activity-text">
                    <span className="mobile-activity-type">{item.actionType}</span>
                    {item.document && (
                      <span className="mobile-activity-doc"> sur {item.document.name}</span>
                    )}
                  </div>
                  <div className="mobile-activity-time">
                    {formatTimeAgo(item.created_at)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="mobile-recent-empty">
              <Activity size={32} />
              <p>Aucune activité récente</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="mobile-modal-overlay">
          <div className="mobile-modal-content">
            <div className="mobile-modal-header">
              <h3>Choisir la destination</h3>
              <p>{tempFiles.length} fichier(s) à classer</p>
            </div>

            <div className="mobile-modal-body">
              <div className="mobile-input-group">
                <label>Espace de travail</label>
                <select 
                  value={selectedEspaceId}
                  onChange={(e) => setSelectedEspaceId(e.target.value)}
                >
                  {allEspaces.map(esp => (
                    <option key={esp.id} value={esp.id}>{esp.name}</option>
                  ))}
                </select>
              </div>

              <div className="mobile-input-group">
                <label>Dossier cible</label>
                <select 
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
                <div className="mobile-input-group">
                  <label className="text-primary">Nom du nouveau dossier</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Contrats, Factures..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="mobile-modal-actions">
              <button className="mobile-btn ghost" onClick={() => setShowUploadModal(false)}>Annuler</button>
              <button className="mobile-btn primary" onClick={confirmUpload} disabled={isSyncing}>
                {isSyncing ? "Envoi..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
