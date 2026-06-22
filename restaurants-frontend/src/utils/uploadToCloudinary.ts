import { api } from '@/services/api';

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Sube un archivo directo a Cloudinary usando una firma generada por el backend
 * (signed upload). El secreto nunca llega al navegador.
 */
export async function uploadToCloudinary(file: File, folder?: string): Promise<UploadResult> {
  // 1) Pedir la firma al backend.
  const signRes = await api.post('/v1/images/sign', null, { params: folder ? { folder } : {} });
  const { cloudName, apiKey, timestamp, folder: signedFolder, signature } = signRes.data.data as {
    cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string;
  };

  // 2) Subir el archivo directo a Cloudinary.
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', signedFolder);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data?.error?.message ?? 'No se pudo subir la imagen');
  }
  return { url: data.secure_url as string, publicId: data.public_id as string };
}

const MAX_MB = 5;
/** Valida tipo y tamaño antes de subir. Devuelve un mensaje de error o null. */
export function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'El archivo debe ser una imagen';
  if (file.size > MAX_MB * 1024 * 1024) return `La imagen no puede superar ${MAX_MB} MB`;
  return null;
}
