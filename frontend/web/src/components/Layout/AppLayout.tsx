import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, FolderOpen, History, Settings, LogOut, Cloud, ShieldCheck } from 'lucide-react';
import './AppLayout.css';
import api from '../../api/client';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname.includes('/dashboard')) return 'Tableau de bord';
    if (location.pathname.includes('/espaces')) return 'Espaces de travail';
    if (location.pathname.includes('/settings')) return 'Paramètres';
    return 'Mboa Drive';
  };

  const linkDrive = async () => {
    try {
      const res = await api.get('/auth/google/url');
      if (res.data.success && res.data.url) {
        // Fenêtre centrée pour une expérience premium
        const width = 500, height = 650;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);
        
        const popup = window.open(
          res.data.url, 
          'MboaDriveAuth', 
          `width=${width},height=${height},top=${top},left=${left}`
        );

        if (!popup) {
          alert("Veuillez autoriser les fenêtres surgissantes pour lier votre Drive.");
          return;
        }

        // --- GESTION ÉVÉNEMENT MESSAGE (FIX COOP) ---
        const handleMessage = (event: MessageEvent) => {
          // On accepte le message drive-linked
          if (event.data?.type === 'drive-linked' && event.data.success) {
            window.removeEventListener('message', handleMessage);
            window.location.reload(); 
          }
        };

        window.addEventListener('message', handleMessage);
      }
    } catch (error) {
      alert("Erreur lors de la liaison au Drive");
    }
  };

  return (
    <div className="layout-container">
      {/* Sidebar / Bottom Nav */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Mboa Drive" className="sidebar-logo" />
          <span>Mboa Drive</span>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/espaces" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FolderOpen size={20} />
            <span>Espaces</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <History size={20} />
            <span>Historique</span>
          </NavLink>
          <div className="flex-1 hidden md:block"></div>
          {/* Settings available on mobile bottom nav too */}
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Paramètres</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost" style={{padding: '0.5rem'}} title="Déconnexion">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        <header className="top-bar">
          <h2 className="top-bar-title">{getPageTitle()}</h2>
          <div className="top-bar-actions">
            {!user?.googleRefreshToken ? (
              <button key="link-drive-btn" onClick={linkDrive} className="btn btn-secondary">
                <Cloud size={18} className="text-warning" />
                <span className="hidden md:inline">Lier Drive</span>
              </button>
            ) : (
              <div key="drive-linked-status" className="flex items-center gap-2 text-success uppercase text-xs font-bold px-3 py-1 rounded bg-green-500/10 border border-green-500/20">
                <Cloud size={14} /> Drive Lié
              </div>
            )}
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
