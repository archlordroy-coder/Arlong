import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import localforage from 'localforage';
import { UploadCloud, Folder, File, WifiOff, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import './Dashboard.css';

interface OfflineFile {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  dossierId: number;
  timestamp: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineFile[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [stats, setStats] = useState({
    espaces: 0,
    dossiers: 0,
    documents: 0
  });

  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  // États pour la modale d'importation
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [tempFiles, setTempFiles] = useState<File[]>([]);
  const [allEspaces, setAllEspaces] = useState<any[]>([]);
  const [selectedEspaceId, setSelectedEspaceId] = useState<string>("");
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [espaceDossiers, setEspaceDossiers] = useState<any[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Chargement des données initiales
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, docsRes] = await Promise.all([
          api.get('/espaces/stats'),
          api.get('/documents', { params: { limit: 5 } })
        ]);
        
        if (statsRes.data.success) setStats(statsRes.data.data);
        if (docsRes.data.success) setRecentDocs(docsRes.data.data.slice(0, 5));
      } catch (error) {
        console.error("Échec du chargement du dashboard:", error);
      }
    };
    fetchDashboardData();
  }, []);

  // Initialisation file d'attente hors-ligne
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

  // Synchronisation automatique au retour internet
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && !isSyncing && user?.googleRefreshToken) {
      syncOfflineFiles();
    }
  }, [isOnline, offlineQueue, user]);

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

        // Retirer de la file d'attente en cas de succès
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
      setDragActive(false);
    } else if ('target' in e && e.target.files) {
      uploadedFiles = (e.target as HTMLInputElement).files;
    }

    if (!uploadedFiles || uploadedFiles.length === 0) return;

    // Récupérer les espaces pour la modale
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

  // Charger les dossiers d'un espace quand il est choisi
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
    if (!selectedDossierId && !showNewFolderInput) {
      alert("Veuillez choisir un dossier de destination.");
      return;
    }

    if (showNewFolderInput && !newFolderName.trim()) {
      alert("Veuillez saisir un nom pour le nouveau dossier.");
      return;
    }

    setShowUploadModal(false);
    let DOSSIER_ID = selectedDossierId ? parseInt(selectedDossierId) : 0;

    // Création dynamique du dossier si demandé
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
          throw new Error("Erreur lors de la création du dossier");
        }
      } catch (err) {
        alert("Impossible de créer le dossier. L'import est annulé.");
        setIsSyncing(false);
        return;
      }
    }

    for (let i = 0; i < tempFiles.length; i++) {
      const file = tempFiles[i];

      if (!isOnline || !user?.googleRefreshToken) {
        // HORS-LIGNE: Sauvegarde locale
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
        alert(`☁️ Mode Hors-ligne : "${file.name}" enregistré localement. Il sera synchronisé dès le retour d'internet.`);
      } else {
        // EN LIGNE: Upload direct
        try {
          setIsSyncing(true);
          const formData = new FormData();
          formData.append('file', file);
          formData.append('dossierId', DOSSIER_ID.toString());
          
          const res = await api.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (res.data.success) {
            alert(`✅ Succès : "${file.name}" a été archivé avec succès sur votre Google Drive !`);
            // On pourrait rafraîchir recentDocs ici
          }
        } catch (error: any) {
          console.error('Upload failed:', error);
          const msg = error.response?.data?.message || "Erreur lors de la synchronisation Drive.";
          alert(`❌ Échec d'envoi pour ${file.name} : ${msg}`);
        } finally {
          setIsSyncing(false);
        }
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Bienvenue, {user?.name}</h1>
          <p className="text-secondary">Voici l'état de votre coffre-fort d'archives.</p>
        </div>
        <button 
          className="btn btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <UploadCloud size={20} />
          <span>Importer</span>
        </button>
      </div>

      <div className="dashboard-grid mb-8">
        <div className="glass-panel stat-card">
          <div className="stat-icon blue"><Folder size={24} /></div>
          <div className="stat-details">
            <h3>{stats.espaces}</h3>
            <p>Espaces de travail</p>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon purple"><Folder size={24} /></div>
          <div className="stat-details">
            <h3>{stats.dossiers}</h3>
            <p>Dossiers partagés</p>
          </div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-icon green"><File size={24} /></div>
          <div className="stat-details">
            <h3>{stats.documents}</h3>
            <p>Documents stockés</p>
          </div>
        </div>
      </div>

      <div 
        className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleFileUpload}
      >
        <UploadCloud size={48} className="mx-auto mb-4 text-primary" />
        <h3 className="text-lg font-bold mb-2">Glissez vos fichiers ici</h3>
        <p className="text-secondary mb-4">ou cliquez sur le bouton pour numériser vers votre Google Drive (Dossier Arlong)</p>
        
        <input 
          type="file" 
          id="file-upload" 
          multiple 
          className="hidden" 
          onChange={handleFileUpload} 
        />
        <label htmlFor="file-upload" className="btn btn-primary cursor-pointer">
          Parcourir les fichiers
        </label>
      </div>

      {/* Barre statut Synchronisation */}
      {offlineQueue.length > 0 && (
        <div className="sync-status">
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <span key="status-offline" className="flex items-center gap-2">
                <WifiOff className="text-warning" /> 
                <span>{offlineQueue.length} fichier(s) en attente de connexion...</span>
              </span>
            ) : !user?.googleRefreshToken ? (
              <span key="status-no-drive" className="flex items-center gap-2">
                <WifiOff className="text-warning" /> 
                <span>{offlineQueue.length} fichier(s) locaux. Veuillez lier votre compte Drive !</span>
              </span>
            ) : isSyncing ? (
              <span key="status-syncing" className="flex items-center gap-2">
                <RefreshCw className="text-primary animate-spin" /> 
                <span>Synchronisation vers Drive en cours...</span>
              </span>
            ) : (
              <span key="status-ready" className="flex items-center gap-2">
                <CheckCircle className="text-success" /> 
                <span>Prêt à synchroniser</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Liste des documents récents */}
      <div className="mt-8 transition-all">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock size={20} className="text-primary" />
          Dernières archives
        </h2>
        <div className="glass-panel overflow-hidden">
          {recentDocs.length > 0 ? (
            <div className="flex flex-col">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg text-secondary">
                      <File size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{doc.name}</div>
                      <div className="text-xs text-muted">Dossier: {doc.dossier.name}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-secondary text-sm">
              Aucun document importé récemment.
            </div>
          )}
        </div>
      </div>

      {/* Modale Destination d'Upload */}
      {showUploadModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content glass-panel max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold">Où archiver ces fichiers ?</h2>
              <p className="text-secondary text-sm">Choisissez la destination sur votre Drive.</p>
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
                  {!showNewFolderInput && espaceDossiers.length === 0 && <option disabled>Aucun dossier trouvé</option>}
                </select>
              </div>

              {showNewFolderInput && (
                <div className="input-group animate-slide-down">
                  <label className="input-label font-bold text-primary">Nom du nouveau dossier</label>
                  <input 
                    type="text" 
                    className="input-field bg-primary/5 border-primary/20 focus:border-primary"
                    placeholder="Ex: Factures 2024, Travaux..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-xs font-bold text-secondary uppercase mb-2">Fichiers à envoyer ({tempFiles.length})</div>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {tempFiles.map((f, idx) => (
                    <div key={idx} className="text-sm truncate flex items-center gap-2">
                      <File size={14} className="text-primary" />
                      {f.name}
                    </div>
                  ))}
                </div>
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

export default Dashboard;
