import { api, extractData } from './api';
import type { AuthUser, LoginDto, RegisterDto } from '@/types/auth';

export interface RegisterDeveloperDto {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RegisterOwnerDto {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  restaurant: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    ruc?: string;
    address: string;
    district?: string;
    city: string;
    region: string;
    totalCapacity: number;
    priceLevel?: number;
  };
}

export const authService = {
  async login(data: LoginDto) {
    return extractData<AuthUser>(await api.post('/v1/auth/login', data));
  },

  async register(data: RegisterDto) {
    return extractData<AuthUser>(await api.post('/v1/auth/register', data));
  },

  /** Solicitud de cuenta de restaurante (queda en revisión del admin). No devuelve token. */
  async registerOwner(data: RegisterOwnerDto) {
    return extractData<void>(await api.post('/v1/auth/register-owner', data));
  },

  /** Registro autoservicio de cuenta de desarrollador — activación inmediata, devuelve token. */
  async registerDeveloper(data: RegisterDeveloperDto) {
    return extractData<AuthUser>(await api.post('/v1/auth/register-developer', data));
  },

  /** Login / registro con Google: envía el ID token de Google y recibe el JWT propio. */
  async google(idToken: string) {
    return extractData<AuthUser>(await api.post('/v1/auth/google', { idToken }));
  },
};
