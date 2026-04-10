import React, { useState } from 'react';
import { Camera, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';
import './Scanner.css';

const Scanner = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedFiles, setScannedFiles] = useState<File[]>([]);

  const requestPermission = () => {
    // Dans une vraie app native, on utiliserait le plugin Capacitor Camera
    setHasPermission(true);
    setIsScanning(true);
  };

  const handleCaptureFictive = () => {
    const dummyFile = new File(["dummy content"], `Scan_${Date.now()}.jpg`, { type: "image/jpeg" });
    setScannedFiles([...scannedFiles, dummyFile]);
    setIsScanning(false);
  };

  const handleRetake = () => {
    setIsScanning(true);
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
              <span>Dernier document scanné ({scannedFiles.length})</span>
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
      {scannedFiles.length > 0 && (
        <div className="scanner-queue">
          <h3>Documents en attente ({scannedFiles.length})</h3>
          <div className="queue-list">
            {scannedFiles.map((file, idx) => (
              <div key={idx} className="queue-item glass-panel">
                <div className="queue-thumb">
                  <ImageIcon size={20} />
                </div>
                <div className="queue-info">
                  <span className="queue-name">{file.name}</span>
                  <span className="queue-size">1.2 MB</span>
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
