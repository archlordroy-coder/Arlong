import { useState, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, FileText, Check, Loader2, Folder, AlertCircle, Trash2, Camera, Plus, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import api from '../../api/client';
import './Scanner.css';

interface ScannedItem {
  file: File;
  toPdf: boolean;
  dataUrl: string;
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
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [previewItem, setPreviewItem] = useState<ScannedItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setScannedItems(prev => [...prev, {
            file,
            toPdf: true,
            dataUrl: reader.result as string
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const togglePdfConversion = (index: number) => {
    const updated = [...scannedItems];
    updated[index].toPdf = !updated[index].toPdf;
    setScannedItems(updated);
  };

  const convertToPdf = async (item: ScannedItem): Promise<File | null> => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          const imgWidth = img.width;
          const imgHeight = img.height;
          const ratio = imgHeight / imgWidth;
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdfWidth * ratio;

          pdf.addImage(item.dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);

          const pdfBlob = pdf.output('blob');
          const pdfFile = new File([pdfBlob], item.file.name.replace(/\.[^.]+$/, '.pdf'), { type: 'application/pdf' });
          resolve(pdfFile);
        };
        img.onerror = () => {
          console.error('Failed to load image');
          resolve(null);
        };
        img.src = item.dataUrl;
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
    } finally {
      if (isLoadingEspaces) setIsLoadingEspaces(false);
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
            } else {
              setSelectedDossierId("root");
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
    if (!selectedEspaceId) return;

    setShowUploadModal(false);
    setIsSaving(true);

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
      let DOSSIER_ID = (selectedDossierId && selectedDossierId !== "root") ? parseInt(selectedDossierId) : 0;

      if (showNewFolderInput && newFolderName) {
        const res = await api.post('/dossiers', {
          name: newFolderName,
          espaceId: parseInt(selectedEspaceId)
        });
        if (res.data.success) {
          DOSSIER_ID = res.data.data.id;
        } else {
          throw new Error("Erreur création dossier");
        }
      } else if (selectedDossierId === "root" || !selectedDossierId) {
        const dRes = await api.get(`/dossiers`, { params: { espaceId: selectedEspaceId } });
        let general = dRes.data.data.find((d: Dossier) => d.name === "Général");
        if (!general) {
          const createRes = await api.post('/dossiers', { name: "Général", espaceId: parseInt(selectedEspaceId) });
          general = createRes.data.data;
        }
        DOSSIER_ID = general.id;
      }

      const errors: string[] = [];

      for (let i = 0; i < scannedItems.length; i++) {
        const item = scannedItems[i];
        setUploadProgress(prev => ({
          ...prev,
          current: i + 1,
          currentFile: item.file.name
        }));

        try {
          let fileToUpload = item.file;
          if (item.toPdf) {
            const pdfFile = await convertToPdf(item);
            if (pdfFile) fileToUpload = pdfFile;
          }

          const formData = new FormData();
          formData.append('file', fileToUpload);
          formData.append('dossierId', DOSSIER_ID.toString());

          await api.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (error) {
          console.error('Upload failed:', error);
          errors.push(item.file.name);
        }
      }

      if (errors.length === 0) {
        setUploadProgress(prev => ({ ...prev, status: 'success' }));
        setTimeout(() => {
          setScannedItems([]);
          setNewFolderName("");
          setShowNewFolderInput(false);
          setShowProgressModal(false);
        }, 2000);
      } else {
        setUploadProgress(prev => ({ ...prev, status: errors.length === scannedItems.length ? 'error' : 'success', errors }));
      }
    } catch (error) {
      console.error('Save error:', error);
      setUploadProgress(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsSaving(false);
    }
  };

  const removeFromQueue = (index: number) => {
    setScannedItems(scannedItems.filter((_, i) => i !== index));
  };

  return (
    <div className="scanner-container animate-fade-in">
      <header className="scanner-header">
        <h1>Numérisation intelligente</h1>
        <p>Transformez vos photos en archives PDF sécurisées.</p>
      </header>

      <div className="scanner-main-view glass-panel">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          multiple 
          hidden 
          ref={fileInputRef} 
          onChange={handleCapture}
        />

        {scannedItems.length === 0 ? (
          <div className="scanner-empty-state" onClick={() => fileInputRef.current?.click()}>
            <div className="scanner-icon-wrap">
              <Camera size={48} />
            </div>
            <h2>Prêt à numériser</h2>
            <p>Cliquez pour prendre une photo ou choisir des images</p>
            <button className="btn-capture-starter">
              <Plus size={20} />
              Démarrer le scan
            </button>
          </div>
        ) : (
          <div className="scanner-active-view">
            <div className="scanner-preview-main">
              <img
                src={scannedItems[scannedItems.length - 1].dataUrl}
                alt="Dernier scan"
                className="main-preview-img"
                onClick={() => setPreviewItem(scannedItems[scannedItems.length - 1])}
              />
              <div className="preview-overlay-info">
                <span>Dernière capture</span>
              </div>
            </div>
            <div className="scanner-quick-actions">
              <button className="btn-add-more" onClick={() => fileInputRef.current?.click()}>
                <Plus size={20} />
                Ajouter une page
              </button>
              <button className="btn-import-all" onClick={openUploadModal}>
                <Upload size={20} />
                Importer {scannedItems.length} document{scannedItems.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>

      {scannedItems.length > 0 && (
        <div className="scanner-queue-section">
          <div className="queue-header">
            <h3>Documents en attente ({scannedItems.length})</h3>
          </div>
          <div className="queue-grid">
            {scannedItems.map((item, idx) => (
              <div key={idx} className="queue-card glass-panel">
                <div className="queue-card-thumb" onClick={() => setPreviewItem(item)}>
                  <img src={item.dataUrl} alt="" />
                  <div className="queue-card-badge">
                    {item.toPdf ? <FileText size={12} /> : <ImageIcon size={12} />}
                  </div>
                </div>
                <div className="queue-card-info">
                  <span className="queue-card-name" title={item.file.name}>{item.file.name}</span>
                  <div className="queue-card-actions">
                    <button
                      className={`btn-toggle-pdf ${item.toPdf ? 'active' : ''}`}
                      onClick={() => togglePdfConversion(idx)}
                      title={item.toPdf ? "Sera converti en PDF" : "Restera en image"}
                    >
                      PDF
                      {item.toPdf && <Check size={10} />}
                    </button>
                    <button className="btn-remove-item" onClick={() => removeFromQueue(idx)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="preview-full-modal" onClick={e => e.stopPropagation()}>
            <img src={previewItem.dataUrl} alt="Aperçu complet" />
            <button className="btn-close-preview" onClick={() => setPreviewItem(null)}>
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Upload Destination Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-wrap">
                <Folder size={32} />
              </div>
              <h2 className="modal-title">Destination des scans</h2>
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
                <div className="input-group animate-slide-up">
                  <label className="input-label highlight">Nom du nouveau dossier</label>
                  <input
                    type="text"
                    className="input-field-highlight"
                    placeholder="Ex: Factures 2024..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowUploadModal(false)}>Annuler</button>
              <button className="btn-confirm" onClick={confirmUpload} disabled={isSaving}>
                {isSaving ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="modal-overlay">
          <div className="progress-modal glass-panel">
            {uploadProgress.status === 'uploading' && (
              <>
                <Loader2 size={48} className="spin icon-primary" />
                <h3>Importation en cours...</h3>
                <p>Vers : <strong>{uploadProgress.targetFolder}</strong></p>
                <div className="progress-bar-wrap">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  ></div>
                </div>
                <span className="progress-stats">{uploadProgress.current} / {uploadProgress.total}</span>
                <span className="current-file">{uploadProgress.currentFile}</span>
              </>
            )}

            {uploadProgress.status === 'success' && (
              <>
                <div className="success-icon-wrap">
                  <Check size={48} />
                </div>
                <h3>Importation terminée !</h3>
                <p>{uploadProgress.total} documents ont été synchronisés.</p>
                {uploadProgress.errors.length > 0 && (
                  <div className="error-summary">
                    <AlertCircle size={14} />
                    <span>{uploadProgress.errors.length} échec(s)</span>
                  </div>
                )}
              </>
            )}

            {uploadProgress.status === 'error' && (
              <>
                <AlertCircle size={48} className="icon-danger" />
                <h3>Erreur d'importation</h3>
                <p>Une erreur est survenue lors de la synchronisation.</p>
                <button className="btn-confirm" onClick={() => setShowProgressModal(false)}>Fermer</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
