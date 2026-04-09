import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div style={{
      maxWidth: 800,
      margin: '80px auto',
      padding: '0 24px',
      fontFamily: 'system-ui, sans-serif',
      color: '#e0e0e0',
      background: '#0d1117',
      minHeight: '100vh',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: 32, color: '#fff', marginBottom: 24 }}>Bienvenue sur ARLONG</h1>
      <p>Gestion d'archives sécurisée, disponible sur Web, Desktop et Mobile.</p>
      <p>
        <Link to="/login" style={{ color: '#58a6ff' }}>Se connecter</Link> •
        <Link to="/privacy" style={{ color: '#58a6ff', marginLeft: '0.5rem' }}>Confidentialité</Link> •
        <Link to="/terms" style={{ color: '#58a6ff', marginLeft: '0.5rem' }}>Conditions d'utilisation</Link>
      </p>
    </div>
  );
};

export default Home;
