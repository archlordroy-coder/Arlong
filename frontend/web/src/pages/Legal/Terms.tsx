import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div style={{
      maxWidth: 800,
      margin: '40px auto',
      padding: '0 24px',
      fontFamily: 'system-ui, sans-serif',
      color: '#e0e0e0',
      background: '#0d1117',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: 28, color: '#fff', marginBottom: 24 }}>📜 Conditions d'utilisation — Mboa Drive</h1>
      <p><strong>Dernière mise à jour :</strong> 9 avril 2026</p>
      <p>Cette application a été développée dans le cadre d'un projet scolaire. Les points suivants s'appliquent :</p>
      <ul>
        <li>Utilisation uniquement à des fins éducatives et de démonstration.</li>
        <li>Aucune collecte de données personnelles autre que les informations d'authentification Google (e‑mail, nom).</li>
        <li>Les documents stockés restent la propriété exclusive de l'utilisateur et sont hébergés sur son compte Google Drive.</li>
        <li>Le code source est disponible publiquement sous licence MIT dans le dépôt GitHub du projet.</li>
      </ul>
      <p>En utilisant Mboa Drive, vous acceptez ces conditions.</p>
      <p>Pour toute question, contactez <a href="mailto:ravel.nghomsi@facsciences-uy1.cm" style={{ color: '#58a6ff' }}>ravel.nghomsi@facsciences-uy1.cm</a>.</p>
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #30363d' }}>
        <Link to="/" style={{ color: '#58a6ff' }}>← Retour à l'accueil</Link>
      </div>
    </div>
  );
};

export default Terms;
