import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    : 'https://arlong-gamma.vercel.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mboadrive_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Une erreur est survenue';

    if (error.response?.status === 401) {
      localStorage.removeItem('mboadrive_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    // Customize error object for better UI reporting
    const customError = new Error(message);
    (customError as any).status = error.response?.status;
    (customError as any).data = error.response?.data;

    return Promise.reject(customError);
  }
);

export default api;
