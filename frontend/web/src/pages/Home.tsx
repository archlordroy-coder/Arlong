import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Cloud, Zap, Lock, FolderOpen, Smartphone } from 'lucide-react';
import './Home.css';

const FEATURES = [
  {
    icon: Shield,
    title: 'Chiffrement AES-256',
    desc: 'Vos fichiers sont chiffrés localement avant tout téléversement. Seul vous détenez la clé.',
    color: 'var(--primary)',
    bg: 'rgba(99,102,241,0.10)',
  },
  {
    icon: Cloud,
    title: 'Synchro Google Drive',
    desc: 'Liez votre Drive en un clic et accédez à vos archives depuis n\'importe où.',
    color: 'var(--secondary)',
    bg: 'rgba(20,184,166,0.10)',
  },
  {
    icon: Zap,
    title: 'Instantané & Léger',
    desc: 'Interface ultra-rapide construite sur Vite. Aucun délai, aucune friction.',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.10)',
  },
  {
    icon: FolderOpen,
    title: 'Gestion avancée',
    desc: 'Organisez vos archives par espaces, tags et dossiers. Retrouvez tout en 2 secondes.',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.10)',
  },
  {
    icon: Lock,
    title: 'Confidentialité totale',
    desc: 'Aucune donnée stockée sans votre consentement. RGPD conforme par conception.',
    color: '#E879F9',
    bg: 'rgba(232,121,249,0.10)',
  },
  {
    icon: Smartphone,
    title: 'Multiplateforme',
    desc: 'Web, Desktop (Windows/Linux) et Android. Votre coffre-fort, partout.',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.10)',
  },
];

const STATS = [
  { value: 'AES-256', label: 'Chiffrement' },
  { value: '3', label: 'Plateformes' },
  { value: '100%', label: 'Open Source' },
  { value: 'RGPD', label: 'Conforme' },
];

const Home: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  // Animation d'entrée par scroll pour les cartes de features
  useEffect(() => {
    const cards = document.querySelectorAll('.home-feature-card');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              (entry.target as HTMLElement).style.opacity = '1';
              (entry.target as HTMLElement).style.transform = 'translateY(0)';
            }, i * 80);
          }
        });
      },
      { threshold: 0.1 }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  // Effet de parallaxe subtil sur la boule lumineuse
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const orb = document.querySelector('.home-orb') as HTMLElement;
      if (!orb) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      orb.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="home-page">
      {/* Arrière-plan dynamique */}
      <div className="home-bg-layer">
        <div className="home-orb home-orb-1"></div>
        <div className="home-orb home-orb-2"></div>
        <div className="home-grid"></div>
      </div>

      {/* ===== NAVBAR ===== */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <div className="home-nav-brand">
            <img src="/logo.png" alt="Arlong" className="home-nav-logo" />
            <span className="home-nav-name">ARLONG</span>
          </div>
          <div className="home-nav-links">
            <Link to="/privacy" className="home-nav-link">Confidentialité</Link>
            <Link to="/terms" className="home-nav-link">Conditions</Link>
            <Link to="/login" className="btn btn-primary home-nav-cta">Se connecter</Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="home-hero" ref={heroRef}>
        <img src="/logo.png" alt="Arlong Logo Central" className="home-hero-logo" />
        <div className="home-hero-badge">
          <span className="home-hero-badge-dot"></span>
          Sécurisé · Chiffré · Open Source
        </div>
        <h1 className="home-hero-title">
          Vos archives.<br />
          <span className="home-hero-gradient">Protégées. Partout.</span>
        </h1>
        <p className="home-hero-subtitle">
          ARLONG est la plateforme de gestion documentaire qui chiffre vos fichiers côté client
          et les synchronise sur votre espace Google Drive personnel — sans jamais y accéder.
        </p>
        <div className="home-hero-actions">
          <Link to="/register" className="btn btn-primary home-cta-main">
            Commencer gratuitement
          </Link>
          <Link to="/login" className="btn btn-secondary home-cta-secondary">
            Se connecter
          </Link>
        </div>

        {/* Stats */}
        <div className="home-stats">
          {STATS.map((s) => (
            <div key={s.label} className="home-stat">
              <span className="home-stat-value">{s.value}</span>
              <span className="home-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="home-features-section">
        <div className="home-section-header">
          <h2 className="home-section-title">Tout ce dont vous avez besoin</h2>
          <p className="home-section-desc">
            Un coffre-fort numérique complet, conçu pour la performance et la confidentialité.
          </p>
        </div>
        <div className="home-features-grid">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="home-feature-card">
                <div className="home-feature-icon-wrap" style={{ background: f.bg }}>
                  <Icon size={22} color={f.color} />
                </div>
                <h3 className="home-feature-title">{f.title}</h3>
                <p className="home-feature-desc">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="home-cta-banner">
        <div className="home-cta-banner-inner">
          <h2 className="home-cta-banner-title">Prêt à sécuriser vos documents ?</h2>
          <p className="home-cta-banner-desc">Créez votre compte en 30 secondes, aucune carte requise.</p>
          <Link to="/register" className="btn btn-primary home-cta-main">
            Créer mon espace
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="home-footer">
        <span>© 2025 ARLONG — Tous droits réservés</span>
        <div className="home-footer-links">
          <Link to="/privacy">Politique de confidentialité</Link>
          <Link to="/terms">Conditions d'utilisation</Link>
        </div>
      </footer>
    </div>
  );
};

export default Home;
