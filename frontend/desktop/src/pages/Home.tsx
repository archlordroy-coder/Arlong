import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, HardDrive, Zap } from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      {/* Arrière-plan animé adapté pour écran large */}
      <div className="home-bg-gradient"></div>
      
      <div className="home-content z-10 glass-panel animate-fade-in p-12 max-w-5xl mx-auto mt-20 text-center rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
        <div className="flex justify-center mb-10">
          <div className="w-32 h-32 flex items-center justify-center p-3 animate-pulse-bg">
            <img src="/logo.png" alt="Arlong Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          </div>
        </div>

        <h1 className="text-5xl font-extrabold mb-6 text-white tracking-tight">
          ARLONG <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Desktop</span>
        </h1>
        
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Le poste de commande de vos archives d'entreprise. <br />
          Organisez, chiffrez et manipulez vos fichiers avec la puissance native de votre ordinateur.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all">
            <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Performances</h3>
            <p className="text-base text-gray-400">Traitement lourd local et téléversement ultra-rapide.</p>
          </div>
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all">
            <HardDrive className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Drive Connecté</h3>
            <p className="text-base text-gray-400">Filtre et synchronise vos classeurs instantanément.</p>
          </div>
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all">
            <Shield className="w-12 h-12 text-white/80 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Chiffrement ZKP</h3>
            <p className="text-base text-gray-400">Seul votre poste détient la clé de vos données.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link to="/login" className="btn btn-primary text-xl px-10 py-4 shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
            Ouvrir mon tableau de bord
          </Link>
          <div className="flex gap-4 text-sm text-gray-400">
            <Link to="/privacy" className="hover:text-white transition-colors">Politique de confidentialité</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
