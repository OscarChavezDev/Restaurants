import { z } from 'zod';

export const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
  description: z.string().max(2000).optional(),
  phone: z.string().regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Teléfono inválido').optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  ruc: z.string().regex(/^[0-9]{11}$/, 'RUC debe tener 11 dígitos').optional().or(z.literal('')),
  address: z.string().min(5, 'Dirección demasiado corta'),
  district: z.string().optional(),
  city: z.string().min(2, 'Ciudad requerida'),
  region: z.string().min(2, 'Región requerida'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  totalCapacity: z.number().min(1, 'Capacidad mínima: 1').max(5000),
  minReservationSize: z.number().min(1).default(1),
  maxReservationSize: z.number().min(1).default(20),
  acceptsReservations: z.boolean().default(true),
  acceptsEvents: z.boolean().default(false),
  hasParking: z.boolean().default(false),
  hasWifi: z.boolean().default(false),
  hasAirConditioning: z.boolean().default(false),
  isAccessible: z.boolean().default(false),
});

export type CreateRestaurantFormData = z.infer<typeof createRestaurantSchema>;

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Nombre demasiado corto').max(150),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Debe contener mayúsculas, minúsculas, número y símbolo'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const createReservationSchema = z.object({
  restaurantId: z.string(),
  customerName: z.string().min(2, 'Nombre requerido').max(150),
  customerEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  customerPhone: z.string().min(6, 'Teléfono requerido'),
  reservationDate: z.string().min(1, 'Fecha requerida'),
  startTime: z.string().min(1, 'Hora requerida'),
  partySize: z.number().min(1, 'Mínimo 1 persona').max(500),
  notes: z.string().max(500).optional(),
  specialRequests: z.string().max(500).optional(),
});

export type CreateReservationFormData = z.infer<typeof createReservationSchema>;
