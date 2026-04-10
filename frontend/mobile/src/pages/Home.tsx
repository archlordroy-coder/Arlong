import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Cloud, Shield } from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="mobile-home">
      {/* En-tête */}
      <header className="mobile-home-header">
        <div className="mobile-home-brand">
          <img src="/logo.png" alt="Arlong" className="mobile-home-logo" />
          <div>
            <h1 className="mobile-home-title">ARLONG</h1>
            <p className="mobile-home-tagline">Document Management</p>
          </div>
        </div>
      </header>

      {/* Hero Card */}
      <section className="mobile-home-hero">
        <div className="mobile-home-hero-glow" />
        <p className="mobile-home-hero-text">
          Vos archives sécurisées,{'\n'}
          <span className="mobile-home-gradient">toujours portables.</span>
        </p>
        <Link to="/login" className="btn btn-primary mobile-home-cta">
          Démarrer
        </Link>
      </section>

      {/* Feature Cards */}
      <section className="mobile-home-features">
        <div className="mobile-feat-card">
          <div className="mobile-feat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Camera size={20} color="var(--primary)" />
          </div>
          <div>
            <p className="mobile-feat-title">Scanner</p>
            <p className="mobile-feat-desc">Numérisez en un clic</p>
          </div>
        </div>

        <div className="mobile-feat-card">
          <div className="mobile-feat-icon" style={{ background: 'rgba(20,184,166,0.12)' }}>
            <Cloud size={20} color="var(--secondary)" />
          </div>
          <div>
            <p className="mobile-feat-title">Synchro Drive</p>
            <p className="mobile-feat-desc">Connecté à votre Google Drive</p>
          </div>
        </div>

        <div className="mobile-feat-card">
          <div className="mobile-feat-icon" style={{ background: 'rgba(148,163,184,0.10)' }}>
            <Shield size={20} color="#94A3B8" />
          </div>
          <div>
            <p className="mobile-feat-title">Coffre-fort</p>
            <p className="mobile-feat-desc">Chiffrement AES-256</p>
          </div>
        </div>
      </section>

      {/* Pied de page légal */}
      <footer className="mobile-home-footer">
        <Link to="/privacy">Confidentialité</Link>
        <span>·</span>
        <Link to="/terms">Conditions</Link>
      </footer>
    </div>
  );
};

export default Home;
