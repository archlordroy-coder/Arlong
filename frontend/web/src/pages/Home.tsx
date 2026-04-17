import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cloud, Zap, Lock, FolderOpen, Smartphone, ChevronRight, Activity } from 'lucide-react';
import './Home.css';

const FEATURES = [
  {
    icon: Shield,
    title: 'Chiffrement AES-256',
    desc: 'Vos fichiers sont chiffrés localement avant tout téléversement. Seul vous détenez la clé.',
    color: '#6366F1',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    icon: Cloud,
    title: 'Synchro Google Drive',
    desc: 'Liez votre Drive en un clic et accédez à vos archives depuis n\'importe où.',
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.1)',
  },
  {
    icon: Zap,
    title: 'Instantané & Léger',
    desc: 'Interface ultra-rapide construite sur Vite. Aucun délai, aucune friction.',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    icon: FolderOpen,
    title: 'Gestion avancée',
    desc: 'Organisez vos archives par espaces, tags et dossiers. Retrouvez tout en 2 secondes.',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.1)',
  },
  {
    icon: Lock,
    title: 'Confidentialité totale',
    desc: 'Aucune donnée stockée sans votre consentement. RGPD conforme par conception.',
    color: '#E879F9',
    bg: 'rgba(232,121,249,0.1)',
  },
  {
    icon: Smartphone,
    title: 'Multiplateforme',
    desc: 'Web, Desktop et Mobile. Votre coffre-fort numérique, partout.',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.1)',
  },
];

const Home: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-container">
      <nav className="home-nav animate-fade-in">
        <div className="nav-content">
          <div className="nav-brand">
            <div className="logo-wrap">
              <Shield size={24} className="text-primary" />
            </div>
            <span className="brand-name">Mboa Drive</span>
          </div>
          <div className="nav-links">
            <Link to="/login" className="nav-link">Connexion</Link>
            <Link to="/register" className="btn btn-primary">Démarrer</Link>
          </div>
        </div>
      </nav>

      <header className="home-hero">
        <div className="hero-content animate-slide-up">
          <div className="hero-badge">Nouveauté : Chiffrement GCM activé</div>
          <h1 className="hero-title">
            Vos documents méritent <br />
            <span className="text-gradient">une sécurité absolue.</span>
          </h1>
          <p className="hero-subtitle">
            Mboa Drive est l'écosystème d'archivage ultime qui chiffre vos données sur votre appareil et les stocke sur votre propre Google Drive.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Créer mon compte gratuit <ChevronRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large">
              Accéder à mon espace
            </Link>
          </div>
        </div>
        <div className="hero-visual animate-fade-in stagger-2">
            <div className="visual-card glass-panel">
                <div className="card-header">
                    <Activity size={18} />
                    <span>Sécurité en temps réel</span>
                </div>
                <div className="card-body">
                    <div className="status-line">
                        <div className="status-dot"></div>
                        <span>AES-256-GCM actif</span>
                    </div>
                    <div className="progress-mini">
                        <div className="progress-fill" style={{width: '85%'}}></div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      <section className="home-features">
        <div className="section-header animate-on-scroll">
            <h2 className="section-title">Pourquoi choisir Mboa Drive ?</h2>
            <p className="section-desc">Une plateforme pensée pour la confidentialité et la performance.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card glass-panel animate-on-scroll" style={{transitionDelay: `${i * 0.1}s`}}>
              <div className="feature-icon" style={{ background: f.bg }}>
                <f.icon size={24} style={{ color: f.color }} />
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-content">
            <p>© 2026 Mboa Drive System. Conçu pour la souveraineté numérique.</p>
            <div className="footer-links">
                <Link to="/privacy">Confidentialité</Link>
                <Link to="/terms">Conditions</Link>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
