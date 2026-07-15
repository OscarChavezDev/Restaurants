export type UserRole = 'ADMIN' | 'RESTAURANTE_OWNER' | 'CLIENTE' | 'SYSTEM_INTEGRATION' | 'DEVELOPER';

export interface AuthUser {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  createdAt?: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errorCode?: string;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
