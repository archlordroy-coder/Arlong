import { useState } from 'react';
import { Camera, RefreshCw, Upload, Image as ImageIcon, FileText, Check, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import './Scanner.css';

interface ScannedItem {
  file: File;
  toPdf: boolean;
}

const Scanner = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const requestPermission = () => {
    setHasPermission(true);
    setIsScanning(true);
  };

  const handleCaptureFictive = () => {
    const dummyFile = new File(["dummy content"], `Scan_${Date.now()}.jpg`, { type: "image/jpeg" });
    setScannedItems([...scannedItems, { file: dummyFile, toPdf: false }]);
    setIsScanning(false);
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

      const imgData = URL.createObjectURL(item.file);
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          const imgWidth = img.width;
          const imgHeight = img.height;
          const ratio = imgHeight / imgWidth;
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdfWidth * ratio;

          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          URL.revokeObjectURL(imgData);

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

  const handleSave = async () => {
    if (scannedItems.length === 0) return;

    setIsSaving(true);
    try {
      const hasPdfConversion = scannedItems.some(item => item.toPdf);
      
      if (hasPdfConversion) {
        setIsConverting(true);
        
        for (let i = 0; i < scannedItems.length; i++) {
          if (scannedItems[i].toPdf) {
            const pdfFile = await convertToPdf(scannedItems[i]);
            if (pdfFile) {
              const updated = [...scannedItems];
              updated[i] = { ...updated[i], file: pdfFile, toPdf: false };
              setScannedItems(updated);
            }
          }
        }
        
        setIsConverting(false);
      }

      console.log('Files ready for upload:', scannedItems.map(i => i.file.name));
      alert(`${scannedItems.length} fichier(s) prêt(s) pour l'importation!`);
      setScannedItems([]);
    } catch (error) {
      console.error('Save error:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
      setIsConverting(false);
    }
  };

  const removeFromQueue = (index: number) => {
    setScannedItems(scannedItems.filter((_, i) => i !== index));
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
              <Camera size={48} />
            </div>
            <h2>Accès Caméra Requis</h2>
            <p>Arlong a besoin de la caméra pour numériser vos documents.</p>
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
              <button className="btn-capture" onClick={handleCaptureFictive}>
                <div className="capture-inner"></div>
              </button>
            </div>
          </div>
        ) : (
          <div className="scanner-preview">
            <div className="preview-image-placeholder">
              <ImageIcon size={48} className="preview-icon-placeholder" />
              <span>Dernier document scanné ({scannedItems.length})</span>
            </div>
            <div className="preview-actions">
              <button className="btn-preview-sec" onClick={handleRetake}>
                <RefreshCw size={18} />
                Nouveau Scan
              </button>
              <button className="btn-preview-pri">
                <Upload size={18} />
                Sauvegarder
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
              onClick={handleSave}
              disabled={isSaving || isConverting}
            >
              {isConverting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Conversion...
                </>
              ) : isSaving ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Sauvegarde...
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
    </div>
  );
};

export default Scanner;
