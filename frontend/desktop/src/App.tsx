import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

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
import AdminDashboard from './pages/Admin/AdminDashboard';
import Gmail from './pages/Workspace/Gmail';
import AIAssistant from './pages/AI/AIAssistant';

// Layout global englobant
import AppLayout from './components/Layout/AppLayout';
import SplashScreen from './components/Common/SplashScreen';
import UpdateChecker from './components/Common/UpdateChecker';

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

  // Afficher le SplashScreen tant que le contexte Auth est en chargement
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider>
      <UpdateChecker />
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
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/espaces" element={
          <ProtectedRoute>
            <AppLayout>
              <Espaces />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/explorer" element={
          <ProtectedRoute>
            <AppLayout>
              <Explorer />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <AppLayout>
              <History />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/scanner" element={
          <ProtectedRoute>
            <Scanner />
          </ProtectedRoute>
        } />
        {/* On ajoutera /espaces/:id etc */}
        
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
