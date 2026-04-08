import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import api from '../../api/client';
import { Camera, Plus, Trash2, FileText, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Scanner.css';

const Scanner = () => {
  const [images, setImages] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [pdfName, setPdfName] = useState(`Scan_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`);
  
  // États pour la destination
  const [allEspaces, setAllEspaces] = useState<any[]>([]);
  const [selectedEspaceId, setSelectedEspaceId] = useState<string>("");
  const [selectedDossierId, setSelectedDossierId] = useState<string>("");
  const [espaceDossiers, setEspaceDossiers] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Charger les espaces au montage
  React.useEffect(() => {
    const fetchEspaces = async () => {
      try {
        const res = await api.get('/espaces');
        if (res.data.success && res.data.data.length > 0) {
          setAllEspaces(res.data.data);
          setSelectedEspaceId(res.data.data[0].id.toString());
        }
      } catch (err) {
        console.error("Erreur espaces scanner", err);
      }
    };
    fetchEspaces();
  }, []);

  // Charger les dossiers quand l'espace change
  React.useEffect(() => {
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
          console.error("Erreur dossiers scanner", e);
        }
      };
      fetchDossiers();
    }
  }, [selectedEspaceId]);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index]);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const generateAndUpload = async () => {
    if (images.length === 0) return;
    setGenerating(true);

    try {
      const pdf = new jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();
        
        // On dessine l'image sur toute la page
        const img = images[i];
        // Note: Dans un vrai mobile, on devrait gérer le redimensionnement
        pdf.addImage(img, 'JPEG', 10, 10, 190, 260); 
      }

      const pdfBlob = pdf.output('blob');
      const fileName = `${pdfName}.pdf`;

      const formData = new FormData();
      formData.append('file', pdfBlob, fileName);
      formData.append('dossierId', selectedDossierId || '1');

      const res = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        alert('Scan converti en PDF et synchronisé !');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Scan error:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="scanner-container animate-fade-in">
      <div className="scanner-header flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="btn btn-ghost p-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Numérisation PDF</h1>
        <div className="w-10"></div>
      </div>

      <div className="scan-options mb-8 flex gap-4">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          multiple 
          hidden 
          ref={fileInputRef} 
          onChange={handleCapture}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-primary flex-1 py-6 flex flex-col items-center gap-2 rounded-2xl"
        >
          <Camera size={32} />
          <span>Prendre une photo</span>
        </button>
      </div>

      <div className="previews-grid grid grid-cols-2 gap-4 mb-20">
        {images.map((img, idx) => (
          <div key={idx} className="preview-item glass-panel relative p-1 rounded-xl overflow-hidden group">
            <img src={img} alt={`page ${idx}`} className="w-full aspect-[3/4] object-cover rounded-lg" />
            <button 
              onClick={() => removeImage(idx)}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg"
            >
              <Trash2 size={16} />
            </button>
            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-bold">
              Page {idx + 1}
            </div>
          </div>
        ))}
        {images.length > 0 && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl aspect-[3/4] hover:bg-white/5"
          >
            <Plus size={32} className="text-secondary" />
          </button>
        )}
      </div>

      {images.length > 0 && (
        <div className="fixed-bottom-bar glass-panel p-6 border-t border-white/10">
          <div className="mb-4">
            <label className="text-xs text-secondary uppercase font-bold mb-2 block">Nom du PDF</label>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
              <FileText size={18} className="text-primary" />
              <input 
                type="text" 
                className="bg-transparent border-none outline-none text-white w-full" 
                value={pdfName}
                onChange={e => setPdfName(e.target.value)}
              />
              <span className="text-secondary">.pdf</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] text-secondary uppercase font-bold mb-1 block">Espace</label>
              <select 
                className="w-full bg-white/5 border-none outline-none text-white text-xs p-2 rounded"
                value={selectedEspaceId}
                onChange={e => setSelectedEspaceId(e.target.value)}
              >
                {allEspaces.map(esp => (
                  <option key={esp.id} value={esp.id}>{esp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-secondary uppercase font-bold mb-1 block">Dossier</label>
              <select 
                className="w-full bg-white/5 border-none outline-none text-white text-xs p-2 rounded"
                value={selectedDossierId}
                onChange={e => setSelectedDossierId(e.target.value)}
              >
                {espaceDossiers.map(dos => (
                  <option key={dos.id} value={dos.id}>{dos.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={generateAndUpload}
            disabled={generating}
            className="btn btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg"
          >
            {generating ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <CheckCircle size={24} />
                <span>Compiler & Envoyer ({images.length} pages)</span>
              </>
            )}
          </button>
        </div>
      )}

      {images.length === 0 && (
        <div className="empty-scan py-20 text-center opacity-30">
          <Camera size={80} className="mx-auto mb-6" />
          <p>Prenez votre première photo pour commencer la numérisation.</p>
        </div>
      )}
    </div>
  );
};

export default Scanner;
