import React, { useState, useEffect } from 'react';
import {
  UploadCloud, Clock, Activity, File, ChevronRight,
  CheckCircle, RefreshCw, WifiOff, FolderPlus, Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEncryption } from '../../hooks/useEncryption';
import api from '../../api/client';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { encrypt, isConfigured } = useEncryption();
  
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ espaces: 0, dossiers: 0, documents: 0 });
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [docsRes, histRes, statsRes] = await Promise.all([
          api.get('/documents?limit=5'),
          api.get('/historique?limit=5'),
          api.get('/espaces/stats')
        ]);
        
        setRecentDocs(docsRes.data.data);
        setHistory(histRes.data.data);
        setStats(statsRes.data.data);
      } catch (error) {
        console.error('Erreur dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!isConfigured) {
      alert("Veuillez configurer votre clé de chiffrement dans les paramètres avant d'uploader.");
      return;
    }

    setIsSyncing(true);
    try {
      for (const file of Array.from(files)) {
        const encryptedBlob = await encrypt(file);
        const formData = new FormData();
        formData.append('file', encryptedBlob, file.name + '.enc');
        formData.append('dossierId', 'root'); // Default for now

        await api.post('/documents/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      alert('Fichiers uploadés avec succès');
      // Refresh data
    } catch (error) {
      alert('Erreur lors de l\'upload');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-primary/10 text-primary">
            <FolderPlus size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.espaces}</span>
            <span className="stat-label">Espaces</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-secondary/10 text-secondary">
            <File size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.documents}</span>
            <span className="stat-label">Documents</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-success/10 text-success">
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{history.length}</span>
            <span className="stat-label">Activités</span>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="upload-section glass-panel">
          <UploadCloud size={48} className="text-primary mb-4" />
          <h3 className="text-lg font-bold">Sécuriser de nouveaux fichiers</h3>
          <p className="text-secondary mb-6 text-center">
            Vos fichiers seront chiffrés localement avec AES-256-GCM <br/>
            avant d'être envoyés vers votre Drive.
          </p>
          <input
            type="file"
            id="file-upload"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload" className="btn btn-primary">
            Sélectionner les fichiers
          </label>

          {isSyncing && (
            <div className="sync-overlay">
              <RefreshCw className="animate-spin text-primary" size={32} />
              <span>Chiffrement et Synchronisation...</span>
            </div>
          )}
        </div>

        <div className="recent-activity">
          <div className="section-header">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              Dernières archives
            </h2>
            <Link to="/explorer" className="text-sm text-primary hover:underline flex items-center gap-1">
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>
          <div className="activity-list glass-panel">
            {recentDocs.length > 0 ? (
              recentDocs.map((doc) => (
                <div key={doc.id} className="activity-item">
                  <div className="item-icon">
                    <File size={18} />
                  </div>
                  <div className="item-details">
                    <span className="item-name">{doc.name}</span>
                    <span className="item-meta">{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">Aucun document récent</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
