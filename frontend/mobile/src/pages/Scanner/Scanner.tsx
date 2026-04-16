import { useState, useEffect } from 'react';
import { RefreshCw, Upload, Image as ImageIcon, FileText, Check, Loader2, Folder, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Camera as CameraPlugin, CameraResultType, CameraSource } from '@capacitor/camera';
import api from '../../api/client';
import './Scanner.css';

interface ScannedItem {
  file: File;
  toPdf: boolean;
  dataUrl?: string;
}

interface Espace {
  id: number;
  name: string;
}

interface Dossier {
  id: number;
  name: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadProgress {
  status: UploadStatus;
  current: number;
  total: number;
  currentFile: string;
  errors: string[];
  targetFolder: string;
}

const Scanner = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [previewItem, setPreviewItem] = useState<ScannedItem | null>(null);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [allEspaces, setAllEspaces] = useState<Espace[]>([]);
  const [selectedEspaceId, setSelectedEspaceId] = useState<string>("");
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [espaceDossiers, setEspaceDossiers] = useState<Dossier[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isLoadingEspaces, setIsLoadingEspaces] = useState(false);

  // Progress modal states
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    current: 0,
    total: 0,
    currentFile: '',
    errors: [],
    targetFolder: ''
  });

  const requestPermission = async () => {
    try {
      const status = await CameraPlugin.checkPermissions();
      if (status.camera === 'denied') {
        await CameraPlugin.requestPermissions();
      }
      setHasPermission(true);
      setIsScanning(true);
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(true);
      setIsScanning(true);
    }
  };

  const takePhoto = async () => {
    setIsTakingPhoto(true);
    try {
      const image = await CameraPlugin.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1920,
        height: 1080
      });

      if (image.dataUrl) {
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const fileName = `Scan_${Date.now()}.${image.format || 'jpg'}`;
        const file = new File([blob], fileName, { type: `image/${image.format || 'jpeg'}` });
        
        setScannedItems(prev => [...prev, { file, toPdf: false, dataUrl: image.dataUrl }]);
        setIsScanning(false);
      }
    } catch (error) {
      console.error('Take photo error:', error);
      setIsScanning(false);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const handleRetake = () => {
    setIsScanning(true);
  };

  const togglePdfConversion = (index: number) => {
    const updated = [...scannedItems];
    updated[index].toPdf = !updated[index].toPdf;
    setScannedItems(updated);
  };

  const convertToPdf = async (item: ScannedItem): Promise<File | null> => {
    if (!item.toPdf) return null;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const imgData = item.dataUrl || URL.createObjectURL(item.file);
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          const imgWidth = img.width;
          const imgHeight = img.height;
          const ratio = imgHeight / imgWidth;
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdfWidth * ratio;

          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          
          if (!item.dataUrl) {
            URL.revokeObjectURL(imgData);
          }

          const pdfBlob = pdf.output('blob');
          const pdfFile = new File([pdfBlob], item.file.name.replace(/\.[^.]+$/, '.pdf'), { type: 'application/pdf' });
          resolve(pdfFile);
        };
        img.onerror = () => {
          console.error('Failed to load image');
          resolve(null);
        };
        img.src = imgData;
      });
    } catch (error) {
      console.error('PDF conversion error:', error);
      return null;
    }
  };

  const openUploadModal = async () => {
    setIsLoadingEspaces(true);
    try {
      const res = await api.get('/espaces');
      if (res.data.success) {
        setAllEspaces(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedEspaceId(res.data.data[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error loading espaces:', error);
      alert('Erreur lors du chargement des espaces');
    } finally {
      setIsLoadingEspaces(false);
    }
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
    if (!selectedEspaceId) {
      return;
    }

    setShowUploadModal(false);
    setIsSaving(true);

    // Determine target folder name
    let targetFolderName = "Racine";
    if (showNewFolderInput && newFolderName) {
      targetFolderName = newFolderName;
    } else if (selectedDossierId && selectedDossierId !== "root") {
      const folder = espaceDossiers.find(d => d.id.toString() === selectedDossierId);
      targetFolderName = folder?.name || "Racine";
    }

    setUploadProgress({
      status: 'uploading',
      current: 0,
      total: scannedItems.length,
      currentFile: '',
      errors: [],
      targetFolder: targetFolderName
    });
    setShowProgressModal(true);

    try {
      // Convert to PDF if needed
      const itemsToUpload: ScannedItem[] = [];
      
      for (const item of scannedItems) {
        if (item.toPdf) {
          const pdfFile = await convertToPdf(item);
          if (pdfFile) {
            itemsToUpload.push({ ...item, file: pdfFile, toPdf: false, dataUrl: undefined });
          }
        } else {
          itemsToUpload.push(item);
        }
      }

      // Get or create target dossier
      let DOSSIER_ID = (selectedDossierId && selectedDossierId !== "root") ? parseInt(selectedDossierId) : 0;

      if (showNewFolderInput && newFolderName) {
        try {
          const res = await api.post('/dossiers', { 
            name: newFolderName, 
            espaceId: parseInt(selectedEspaceId) 
          });
          if (res.data.success) {
            DOSSIER_ID = res.data.data.id;
          } else {
            throw new Error("Erreur création dossier");
          }
        } catch {
          setUploadProgress(prev => ({ ...prev, status: 'error' }));
          setIsSaving(false);
          return;
        }
      } else if (selectedDossierId === "root" || !selectedDossierId) {
        try {
          const dRes = await api.get(`/dossiers`, { params: { espaceId: selectedEspaceId } });
          let general = dRes.data.data.find((d: Dossier) => d.name === "Général");
          if (!general) {
            const createRes = await api.post('/dossiers', { name: "Général", espaceId: parseInt(selectedEspaceId) });
            general = createRes.data.data;
          }
          DOSSIER_ID = general.id;
        } catch {
          setUploadProgress(prev => ({ ...prev, status: 'error' }));
          setIsSaving(false);
          return;
        }
      }

      // Upload files with progress
      const errors: string[] = [];
      
      for (let i = 0; i < itemsToUpload.length; i++) {
        const item = itemsToUpload[i];
        setUploadProgress(prev => ({ 
          ...prev, 
          current: i + 1, 
          currentFile: item.file.name 
        }));

        try {
          const formData = new FormData();
          formData.append('file', item.file);
          formData.append('dossierId', DOSSIER_ID.toString());
          
          await api.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (error) {
          console.error('Upload failed:', error);
          errors.push(item.file.name);
        }
      }

      // Set final status
      if (errors.length === 0) {
        setUploadProgress(prev => ({ ...prev, status: 'success' }));
        setTimeout(() => {
          setScannedItems([]);
          setNewFolderName("");
          setShowNewFolderInput(false);
          setShowProgressModal(false);
        }, 1500);
      } else if (errors.length === itemsToUpload.length) {
        setUploadProgress(prev => ({ ...prev, status: 'error', errors }));
      } else {
        setUploadProgress(prev => ({ ...prev, status: 'success', errors }));
      }
    } catch (error) {
      console.error('Save error:', error);
      setUploadProgress(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsSaving(false);
    }
  };

  const closeProgressModal = () => {
    if (uploadProgress.status !== 'uploading') {
      setShowProgressModal(false);
      setUploadProgress({
        status: 'idle',
        current: 0,
        total: 0,
        currentFile: '',
        errors: [],
        targetFolder: ''
      });
    }
  };

  const removeFromQueue = (index: number) => {
    setScannedItems(scannedItems.filter((_, i) => i !== index));
  };

  const getLastScanned = () => {
    if (scannedItems.length === 0) return null;
    return scannedItems[scannedItems.length - 1];
  };

  return (
    <div className="scanner-container">
      <header className="scanner-header">
        <h1>Scanner de documents</h1>
        <p>Numérisez automatiquement vos documents papier.</p>
      </header>

      {/* Main scanner view */}
      <div className="scanner-main-view glass-panel">
        {!hasPermission ? (
          <div className="scanner-permission">
            <div className="scanner-icon-wrap">
              <ImageIcon size={48} />
            </div>
            <h2>Accès Caméra Requis</h2>
            <p>Mboa Drive a besoin de la caméra pour numériser vos documents.</p>
            <button className="btn-allow-camera" onClick={requestPermission}>
              Autoriser l'accès
            </button>
          </div>
        ) : isScanning ? (
          <div className="scanner-active">
            <div className="scanner-viewfinder">
              <div className="corner top-left"></div>
              <div className="corner top-right"></div>
              <div className="corner bottom-left"></div>
              <div className="corner bottom-right"></div>
              <p className="scanner-instruction">Placez le document dans le cadre</p>
            </div>
            <div className="scanner-controls">
              <button 
                className="btn-capture" 
                onClick={takePhoto}
                disabled={isTakingPhoto}
              >
                {isTakingPhoto ? (
                  <Loader2 size={24} className="spin" />
                ) : (
                  <div className="capture-inner"></div>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="scanner-preview">
            {getLastScanned()?.dataUrl ? (
              <img 
                src={getLastScanned()?.dataUrl} 
                alt="Preview" 
                className="preview-image"
                onClick={() => setPreviewItem(getLastScanned())}
              />
            ) : (
              <div className="preview-image-placeholder">
                <ImageIcon size={48} className="preview-icon-placeholder" />
                <span>Aucun scan récent</span>
              </div>
            )}
            <div className="preview-actions">
              <button className="btn-preview-sec" onClick={handleRetake}>
                <RefreshCw size={18} />
                Nouveau Scan
              </button>
              <button className="btn-preview-pri" onClick={() => setPreviewItem(getLastScanned())}>
                <ImageIcon size={18} />
                Aperçu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste des scans en attente */}
      {scannedItems.length > 0 && (
        <div className="scanner-queue">
          <div className="queue-header">
            <h3>Documents en attente ({scannedItems.length})</h3>
            <button 
              className="btn-save-all"
              onClick={openUploadModal}
              disabled={isSaving || isLoadingEspaces}
            >
              {isLoadingEspaces ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Chargement...
                </>
              ) : isSaving ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Importation...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Importer
                </>
              )}
            </button>
          </div>
          <div className="queue-list">
            {scannedItems.map((item, idx) => (
              <div key={idx} className="queue-item glass-panel">
                <div className="queue-thumb">
                  {item.file.type === 'application/pdf' ? (
                    <FileText size={20} />
                  ) : item.dataUrl ? (
                    <img src={item.dataUrl} alt="" className="queue-thumb-img" />
                  ) : (
                    <ImageIcon size={20} />
                  )}
                </div>
                <div className="queue-info">
                  <span className="queue-name">{item.file.name}</span>
                  <span className="queue-meta">
                    {item.file.type === 'application/pdf' ? 'PDF' : item.file.type.split('/')[1].toUpperCase()}
                    {item.toPdf && <span className="queue-pdf-badge">→ PDF</span>}
                  </span>
                </div>
                <div className="queue-actions">
                  {item.file.type !== 'application/pdf' && (
                    <button 
                      className={`queue-convert-btn ${item.toPdf ? 'active' : ''}`}
                      onClick={() => togglePdfConversion(idx)}
                      title="Convertir en PDF"
                    >
                      <FileText size={16} />
                      {item.toPdf ? <Check size={12} /> : null}
                    </button>
                  )}
                  <button 
                    className="queue-remove-btn"
                    onClick={() => removeFromQueue(idx)}
                    title="Supprimer"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewItem && (
        <div className="scanner-modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="scanner-modal-content" onClick={e => e.stopPropagation()}>
            {previewItem.dataUrl && (
              <img src={previewItem.dataUrl} alt="Preview" className="scanner-modal-image" />
            )}
            <button className="scanner-modal-close" onClick={() => setPreviewItem(null)}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Upload Destination Modal */}
      {showUploadModal && (
        <div className="scanner-modal-overlay">
          <div className="scanner-upload-modal">
            <div className="scanner-upload-header">
              <h3>Choisir la destination</h3>
              <button className="scanner-upload-close" onClick={() => setShowUploadModal(false)}>×</button>
            </div>
            
            <div className="scanner-upload-body">
              <div className="scanner-upload-info">
                <ImageIcon size={20} />
                <span>{scannedItems.length} scan(s) à importer</span>
              </div>

              <div className="scanner-input-group">
                <label>
                  <Folder size={14} />
                  Espace de travail
                </label>
                <select 
                  value={selectedEspaceId}
                  onChange={(e) => setSelectedEspaceId(e.target.value)}
                >
                  {allEspaces.map(esp => (
                    <option key={esp.id} value={esp.id}>{esp.name}</option>
                  ))}
                </select>
              </div>

              <div className="scanner-input-group">
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
                <div className="scanner-input-group">
                  <label className="scanner-label-new">Nom du nouveau dossier</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Contrats, Factures..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="scanner-upload-actions">
              <button className="scanner-btn-cancel" onClick={() => setShowUploadModal(false)}>
                Annuler
              </button>
              <button className="scanner-btn-confirm" onClick={confirmUpload} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Importation...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Importer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="scanner-modal-overlay">
          <div className="scanner-progress-modal">
            {uploadProgress.status === 'uploading' && (
              <>
                <div className="progress-icon">
                  <Loader2 size={48} className="spin" />
                </div>
                <h3>Importation en cours</h3>
                <p className="progress-folder">
                  <Folder size={14} />
                  {uploadProgress.targetFolder}
                </p>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
                <p className="progress-text">
                  {uploadProgress.current} / {uploadProgress.total} fichiers
                </p>
                <p className="progress-current-file">{uploadProgress.currentFile}</p>
              </>
            )}

            {uploadProgress.status === 'success' && (
              <>
                <div className="progress-icon success">
                  <Check size={48} />
                </div>
                <h3>Importation réussie !</h3>
                <p className="progress-folder">
                  <Folder size={14} />
                  {uploadProgress.targetFolder}
                </p>
                <p className="progress-success-text">
                  {uploadProgress.total} fichier(s) importé(s)
                </p>
                {uploadProgress.errors.length > 0 && (
                  <p className="progress-errors">
                    {uploadProgress.errors.length} erreur(s)
                  </p>
                )}
              </>
            )}

            {uploadProgress.status === 'error' && (
              <>
                <div className="progress-icon error">
                  <AlertCircle size={48} />
                </div>
                <h3>Erreur d'importation</h3>
                <p className="progress-folder">
                  <Folder size={14} />
                  {uploadProgress.targetFolder}
                </p>
                <p className="progress-error-text">
                  {uploadProgress.errors.length > 0 
                    ? `${uploadProgress.errors.length} fichier(s) échoué(s)`
                    : 'Une erreur est survenue'}
                </p>
                <button className="progress-close-btn" onClick={closeProgressModal}>
                  Fermer
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
