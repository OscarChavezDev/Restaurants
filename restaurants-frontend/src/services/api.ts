import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar el token JWT en cada request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

import toast from 'react-hot-toast';

// Manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message: string; errorCode: string }>) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      if (typeof window !== 'undefined') toast.error('El servidor tardó mucho en responder. Verifica tu conexión.');
    } else if (error.response?.status === 500) {
      if (typeof window !== 'undefined') toast.error('Ocurrió un problema en el servidor. Intenta de nuevo en unos minutos.');
    } else if (!error.response && error.request) {
      if (typeof window !== 'undefined') toast.error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    }

    return Promise.reject(error);
  }
);

export const extractData = <T>(response: { data: { data: T } }): T => response.data.data;
