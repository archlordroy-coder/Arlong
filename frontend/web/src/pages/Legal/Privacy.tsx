import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif', color: '#e0e0e0', background: '#0d1117', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 28, marginBottom: 32, color: '#fff' }}>🔒 Politique de Confidentialité — Mboa Drive</h1>
      <p><strong>Dernière mise à jour :</strong> 9 avril 2026</p>

      <h2 style={{ marginTop: 24 }}>1. Données collectées</h2>
      <p>Mboa Drive collecte uniquement les données nécessaires à son fonctionnement :</p>
      <ul>
        <li>Votre adresse e-mail et nom (via Google OAuth) pour l'authentification.</li>
        <li>Les fichiers et documents que vous choisissez de stocker via Google Drive.</li>
      </ul>

      <h2 style={{ marginTop: 24 }}>2. Utilisation des données</h2>
      <p>Vos données sont utilisées exclusivement pour :</p>
      <ul>
        <li>Vous authentifier sur la plateforme.</li>
        <li>Gérer vos espaces d'archives et vos documents.</li>
        <li>Synchroniser vos fichiers avec votre compte Google Drive personnel.</li>
      </ul>

      <h2 style={{ marginTop: 24 }}>3. Partage des données</h2>
      <p>Mboa Drive ne vend, ne loue et ne partage aucune donnée personnelle avec des tiers. Vos documents restent strictement sur votre propre compte Google Drive.</p>

      <h2 style={{ marginTop: 24 }}>4. Sécurité</h2>
      <p>Les connexions sont sécurisées via HTTPS et l'authentification est gérée par le protocole standard OAuth 2.0 de Google. Les tokens d'accès sont stockés de manière sécurisée côté serveur.</p>

      <h2 style={{ marginTop: 24 }}>5. Contact</h2>
      <p>Pour toute question relative à la confidentialité, contactez-nous à : <strong>ravel.nghomsi@facsciences-uy1.cm</strong></p>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #30363d' }}>
        <Link to="/login" style={{ color: '#58a6ff' }}>← Retour à l'application</Link>
      </div>
    </div>
  );
};

export default Privacy;
