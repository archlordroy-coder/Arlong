import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Camera, Cloud } from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="home-bg"></div>

      <div className="home-card">
        {/* Logo + Titre */}
        <div className="home-header">
          <img src="/logo.png" alt="Arlong" className="home-logo" />
          <h1 className="home-title">ARLONG <span className="home-accent">Mobile</span></h1>
          <p className="home-subtitle">Vos archives sécurisées, toujours dans votre poche.</p>
        </div>

        {/* Features */}
        <div className="home-features">
          <div className="feature-row">
            <div className="feature-icon-wrap">
              <Camera size={20} className="feature-icon" />
            </div>
            <div>
              <p className="feature-title">Scanner intégré</p>
              <p className="feature-desc">Numérisez vos documents en un clic.</p>
            </div>
          </div>
          <div className="feature-row">
            <div className="feature-icon-wrap">
              <Cloud size={20} className="feature-icon secondary" />
            </div>
            <div>
              <p className="feature-title">Synchro Drive</p>
              <p className="feature-desc">Connecté à votre espace Google.</p>
            </div>
          </div>
          <div className="feature-row">
            <div className="feature-icon-wrap">
              <Shield size={20} className="feature-icon muted" />
            </div>
            <div>
              <p className="feature-title">Coffre-fort numérique</p>
              <p className="feature-desc">Chiffrement fort à la source.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="home-actions">
          <Link to="/login" className="btn btn-primary home-btn">Démarrer</Link>
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
