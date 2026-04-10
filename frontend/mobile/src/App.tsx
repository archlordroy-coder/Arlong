import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Fullscreen } from '@boengli/capacitor-fullscreen';

// Pages placeholders
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Espaces from './pages/Espaces/Espaces';
import Explorer from './pages/Explorer/Explorer';
import History from './pages/History/History';
import Home from './pages/Home';
import Settings from './pages/Settings/Settings';
import Scanner from './pages/Scanner/Scanner';
import Privacy from './pages/Legal/Privacy';
import Terms from './pages/Legal/Terms';

// Layouts
import MobileLayout from './components/Layout/MobileLayout';
import SplashScreen from './components/Common/SplashScreen';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

const App = () => {
  const { isLoading } = useAuth();

  useEffect(() => {
    // Initialisation du comportement natif mobile
    const initNativeFeatures = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0d1117' });
        await Keyboard.setResizeMode({ mode: KeyboardResize.None });
        
        // Mode immersif total : masque les 3 boutons Android (Retour, Accueil, Récents)
        await Fullscreen.activateImmersiveMode();
      } catch (err) {
        // Ignorer silencieusement si exécuté sur le web et non sur mobile natif
      }
    };
    initNativeFeatures();
  }, []);

  useEffect(() => {
    // Cacher l'écran de démarrage natif une fois que le contexte React a fini de charger
    if (!isLoading) {
      try {
        CapSplashScreen.hide();
      } catch (e) {}
    }
  }, [isLoading]);

  // Afficher le SplashScreen logiciel tant que le contexte Auth est en chargement
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Router >
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Routes publiques */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        
        {/* Pages légales publiques (requises par Google OAuth) */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* Routes protégées */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MobileLayout><Dashboard /></MobileLayout>
          </ProtectedRoute>
        } />
        <Route path="/espaces" element={
          <ProtectedRoute>
            <MobileLayout><Espaces /></MobileLayout>
          </ProtectedRoute>
        } />
        <Route path="/explorer" element={
          <ProtectedRoute>
            <MobileLayout><Explorer /></MobileLayout>
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <MobileLayout><History /></MobileLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <MobileLayout><Settings /></MobileLayout>
          </ProtectedRoute>
        } />
        <Route path="/scanner" element={
          <ProtectedRoute>
            <MobileLayout><Scanner /></MobileLayout>
          </ProtectedRoute>
        } />
        {/* On ajoutera /espaces/:id etc */}
        
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;
