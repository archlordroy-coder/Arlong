import React from 'react';
import { useEncryption } from '../../hooks/useEncryption';
import { Shield, Key, Lock, Trash2, CheckCircle } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { encryptionKey, saveKey, clearKey, isConfigured } = useEncryption();
  const [newKey, setNewKey] = React.useState('');

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKey.length < 8) {
      alert('La clé doit faire au moins 8 caractères.');
      return;
    }
    saveKey(newKey);
    setNewKey('');
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
                <Shield size={20} />
                <h2>Protection Native</h2>
            </div>
            <p className="section-desc">Version Desktop {import.meta.env.VITE_APP_VERSION || '2.0.0'}</p>
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
