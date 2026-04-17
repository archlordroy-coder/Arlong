import React, { useState } from 'react';
import { useEncryption } from '../../hooks/useEncryption';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Key, Lock, Trash2, CheckCircle, Cloud, RefreshCw } from 'lucide-react';
import api from '../../api/client';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const { encryptionKey, saveKey, clearKey, isConfigured } = useEncryption();
  const [newKey, setNewKey] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKey.length < 8) {
      alert('La clé doit faire au moins 8 caractères.');
      return;
    }
    saveKey(newKey);
    setNewKey('');
  };

  const handleLinkGoogle = async () => {
    setGoogleLoading(true);
    try {
      const res = await api.get('/auth/google/url?platform=web');
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert('Erreur lors de la liaison Google Drive');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="settings-container animate-fade-in">
      <div className="settings-header">
        <Shield size={32} className="text-primary" />
        <h1>Sécurité & Chiffrement</h1>
      </div>

      <div className="settings-grid">
        <section className="settings-section glass-panel">
          <div className="section-title">
            <Key size={20} />
            <h2>Clé Maîtresse d'Archivage</h2>
          </div>
          <p className="section-desc">
            Cette clé est utilisée pour chiffrer vos fichiers sur votre appareil.
            <strong> Elle n'est jamais envoyée au serveur.</strong> Si vous la perdez,
            vos archives cryptées seront illisibles.
          </p>

          {isConfigured ? (
            <div className="key-status-configured">
              <div className="status-badge">
                <CheckCircle size={16} />
                <span>Clé configurée et active</span>
              </div>
              <button onClick={clearKey} className="btn btn-secondary">
                <Trash2 size={16} /> Réinitialiser la clé
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveKey} className="key-setup-form">
              <div className="input-group">
                <label className="input-label">Définir une nouvelle clé</label>
                <div className="input-with-icon">
                  <Lock size={18} className="text-muted" />
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Votre clé secrète (min. 8 chars)"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Activer le chiffrement</button>
            </form>
          )}
        </section>

        <section className="settings-section glass-panel">
            <div className="section-title">
                <Cloud size={20} />
                <h2>Connexion Cloud</h2>
            </div>
            <p className="section-desc">
              Liez votre compte Google Drive pour activer l'archivage automatique et la synchronisation.
            </p>
            
            {user?.googleRefreshToken ? (
              <div className="drive-connected">
                <div className="status-badge success">
                  <CheckCircle size={16} />
                  <span>Google Drive connecté</span>
                </div>
                <p className="text-xs text-secondary mt-2">Dossier : My Drive / Mboa Drive</p>
              </div>
            ) : (
              <button 
                onClick={handleLinkGoogle} 
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
                disabled={googleLoading}
              >
                {googleLoading ? <RefreshCw className="animate-spin" size={16} /> : <Cloud size={16} />}
                Lier mon compte Google Drive
              </button>
            )}
        </section>

        <section className="settings-section glass-panel">
            <div className="section-title">
                <Shield size={20} />
                <h2>Protection Native</h2>
            </div>
            <p className="section-desc">Architecture Arlong {import.meta.env.VITE_APP_VERSION || '2.0.0'}</p>
            <div className="feature-list">
                <div className="feature-item">
                    <CheckCircle size={16} className="text-success" />
                    <span>Isolation du contexte active</span>
                </div>
                <div className="feature-item">
                    <CheckCircle size={16} className="text-success" />
                    <span>Pont IPC sécurisé</span>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
