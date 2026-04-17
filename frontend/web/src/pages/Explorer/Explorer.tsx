import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, File, Download, Trash2,
  ExternalLink, MoreVertical, LayoutGrid, List,
  Lock, Unlock
} from 'lucide-react';
import api from '../../api/client';
import { useEncryption } from '../../hooks/useEncryption';
import './Explorer.css';

const Explorer = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { decrypt, isConfigured } = useEncryption();

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents', { params: { search } });
      setDocuments(res.data.data);
    } catch (err) {
      console.error('Fetch docs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [search]);

  const handleDownload = async (doc: any) => {
    try {
      const res = await api.get(`/documents/download/${doc.id}`, { responseType: 'blob' });
      const blob = res.data;

      let finalBlob = blob;
      if (doc.name.endsWith('.enc')) {
        if (!isConfigured) {
          alert('Veuillez configurer votre clé de déchiffrement.');
          return;
        }
        try {
            const decryptedBuffer = await decrypt(blob);
            finalBlob = new Blob([decryptedBuffer]);
        } catch (e) {
            alert('Erreur de déchiffrement. Clé incorrecte ?');
            return;
        }
      }

      const url = window.URL.createObjectURL(finalBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.name.replace('.enc', ''));
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="explorer-container animate-fade-in">
      <div className="explorer-toolbar glass-panel">
        <div className="search-wrap">
          <Search size={18} className="text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher une archive..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-actions">
          <button className="btn btn-ghost"><Filter size={18} /></button>
          <div className="view-toggle">
            <button className="btn btn-ghost active"><LayoutGrid size={18} /></button>
            <button className="btn btn-ghost"><List size={18} /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Chargement de vos archives...</div>
      ) : (
        <div className="explorer-grid">
          {documents.map((doc) => (
            <div key={doc.id} className="doc-card glass-panel">
              <div className="doc-preview">
                {doc.name.endsWith('.enc') ? <Lock size={32} className="text-primary" /> : <File size={32} />}
              </div>
              <div className="doc-info">
                <span className="doc-name">{doc.name}</span>
                <span className="doc-meta">{(doc.size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}</span>
              </div>
              <div className="doc-actions">
                <button onClick={() => handleDownload(doc)} className="btn btn-ghost" title="Télécharger">
                  <Download size={18} />
                </button>
                <button className="btn btn-ghost" title="Options">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="empty-explorer">Aucun document trouvé</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Explorer;
