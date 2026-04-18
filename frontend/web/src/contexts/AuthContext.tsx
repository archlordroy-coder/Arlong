import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  googleRefreshToken: string | null;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier la session au chargement
  useEffect(() => {
    // Gérer le retour de Google Drive linking (URL param)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('drive_linked') === 'true') {
      const refreshProfile = async () => {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            // Mettre à jour le user avec le nouveau googleRefreshToken
            setUser(res.data.data);
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {}
      };
      refreshProfile();
    }

    const checkAuth = async () => {
      // On commence le timer pour le splash screen
      const timer = new Promise(resolve => setTimeout(resolve, 1500));
      
      const token = localStorage.getItem('mboadrive_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            localStorage.removeItem('mboadrive_token');
          }
        }
      }
      
      // On attend que les deux soient finis : le timer et la requête
      await timer;
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('mboadrive_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('mboadrive_token');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
