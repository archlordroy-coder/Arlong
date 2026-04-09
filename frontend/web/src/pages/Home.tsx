import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cloud, Monitor, Smartphone } from 'lucide-react';
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
            Bienvenue sur <span className="home-accent">ARLONG</span>
          </h1>
          <p className="home-subtitle">
            La plateforme de gestion d'archives sécurisée, disponible sur Web, Desktop et Mobile.
          </p>
        </div>

        {/* Features */}
        <div className="home-features">
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <Shield size={20} className="feature-icon" />
            </div>
            <p className="feature-title">Chiffrement AES</p>
            <p className="feature-desc">Sécurité de bout en bout pour vos fichiers.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap">
              <Cloud size={20} className="feature-icon secondary" />
            </div>
            <p className="feature-title">Google Drive</p>
            <p className="feature-desc">Synchronisation directe avec votre Drive.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap" style={{ background: 'rgba(148,163,184,0.1)' }}>
              <Monitor size={18} className="feature-icon muted" />
            </div>
            <p className="feature-title">Multiplateforme</p>
            <p className="feature-desc">Web, Windows, Linux et Android.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="home-actions">
          <Link to="/login" className="btn btn-primary home-btn">
            Accéder à mon espace
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
