import React, { useState, useRef } from 'react';
import { Camera, Plus, Upload, Trash2, X, FileText, ImageIcon, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useEncryption } from '../../hooks/useEncryption';
import api from '../../api/client';
import './Scanner.css';

const Scanner = () => {
  const [scannedItems, setScannedItems] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { encrypt, isConfigured } = useEncryption();

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScannedItems(prev => [...prev, {
          file,
          dataUrl: event.target?.result,
          toPdf: true
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const generatePDF = async (item: any) => {
    const pdf = new jsPDF();
    const img = new Image();
    img.src = item.dataUrl;

    return new Promise<Blob>((resolve) => {
      img.onload = () => {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = img.width / img.height;
        const imgWidth = pageWidth;
        const imgHeight = pageWidth / ratio;

        pdf.addImage(item.dataUrl, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
        resolve(pdf.output('blob'));
      };
    });
  };

  const confirmUpload = async () => {
    if (scannedItems.length === 0) return;
    if (!isConfigured) {
        alert('Configurez votre clé de chiffrement avant de sauvegarder.');
        return;
    }

    setIsSaving(true);
    try {
      for (const item of scannedItems) {
        let blobToUpload = item.file;
        let fileName = item.file.name;

        if (item.toPdf) {
          blobToUpload = await generatePDF(item);
          fileName = fileName.split('.')[0] + '.pdf';
        }

        const encryptedBlob = await encrypt(blobToUpload);
        const formData = new FormData();
        formData.append('file', encryptedBlob, fileName + '.enc');
        formData.append('dossierId', 'root');

        await api.post('/documents/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      alert('Documents sauvegardés et chiffrés !');
      setScannedItems([]);
    } catch (err) {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="scanner-container animate-fade-in">
      <header className="scanner-header">
        <h1>Scanner Intelligent</h1>
        <p>Numérisez, chiffrez et archivez vos documents physiques.</p>
      </header>

      <div className="scanner-main glass-panel">
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
          <div className="scanner-placeholder" onClick={() => fileInputRef.current?.click()}>
            <div className="icon-circle"><Camera size={32} /></div>
            <h3>Prêt à scanner</h3>
            <button className="btn btn-primary">Démarrer la capture</button>
          </div>
        ) : (
          <div className="scanner-queue">
            <div className="queue-grid">
              {scannedItems.map((item, i) => (
                <div key={i} className="queue-item glass-panel">
                  <img src={item.dataUrl} alt="" />
                  <div className="item-overlay">
                    <button onClick={() => setScannedItems(scannedItems.filter((_, idx) => idx !== i))} className="btn-remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="add-more-card" onClick={() => fileInputRef.current?.click()}>
                <Plus size={32} />
              </div>
            </div>
            <div className="scanner-actions">
              <button className="btn btn-secondary" onClick={() => setScannedItems([])}>Tout effacer</button>
              <button className="btn btn-primary" onClick={confirmUpload} disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                Enregistrer {scannedItems.length} documents
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
