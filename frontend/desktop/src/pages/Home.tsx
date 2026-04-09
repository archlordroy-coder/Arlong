import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, HardDrive, Zap } from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="home-bg"></div>

      <div className="home-card">
        {/* Logo + Titre */}
        <div className="home-header">
          <img src="/logo.png" alt="Arlong" className="home-logo" />
          <h1 className="home-title">
            ARLONG <span className="home-accent">Desktop</span>
          </h1>
          <p className="home-subtitle">
            Le poste de commande de vos archives. Organisez et chiffrez vos documents avec la puissance native de votre machine.
          </p>
        </div>

        {/* Features */}
        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <Zap size={20} className="feature-icon" />
            </div>
            <p className="feature-title">Performances locales</p>
            <p className="feature-desc">Traitement rapide sans serveur intermédiaire.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <HardDrive size={20} className="feature-icon secondary" />
            </div>
            <p className="feature-title">Drive Connecté</p>
            <p className="feature-desc">Synchronisation transparente avec Google Drive.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap" style={{ background: 'rgba(148,163,184,0.1)' }}>
              <Shield size={20} className="feature-icon muted" />
            </div>
            <p className="feature-title">Chiffrement ZKP</p>
            <p className="feature-desc">Seul votre poste détient votre clé.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="home-actions">
          <Link to="/login" className="btn btn-primary home-btn">
            Ouvrir mon tableau de bord
          </Link>
          <div className="home-legal">
            <Link to="/privacy">Confidentialité</Link>
            <span>·</span>
            <Link to="/terms">Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
