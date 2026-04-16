import axios from 'axios';

const api = axios.create({
  // Utilisation de l'URL absolue Vercel en production
  baseURL: import.meta.env.DEV 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    : 'https://arlong-gamma.vercel.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour injecter le token JWT (sauf sur endpoints publics)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mboadrive_token');
    const isPublicEndpoint = config.url?.includes('/auth/login') || 
                             config.url?.includes('/auth/register') ||
                             config.url?.includes('/auth/google');
    
    if (token && config.headers && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs (ex: token expiré)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mboadrive_token');
      // Rediriger vers le login si on n'y est pas
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
