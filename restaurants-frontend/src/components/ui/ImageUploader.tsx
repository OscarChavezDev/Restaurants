'use client';

import { useRef, useState } from 'react';
import { UploadCloud, Loader2, ImagePlus } from 'lucide-react';
import { uploadToCloudinary, validateImage } from '@/utils/uploadToCloudinary';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export function ImageUploader({
  folder,
  onUploaded,
  label = 'Subir imagen',
  hint = 'Arrastra una foto aquí o haz clic para elegir (JPG/PNG, máx 5 MB)',
  className,
  compact = false,
}: {
  folder?: string;
  onUploaded: (url: string, publicId: string) => void;
  label?: string;
  hint?: string;
  className?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    const err = validateImage(file);
    if (err) { toast.error(err); return; }
    try {
      setUploading(true);
      const { url, publicId } = await uploadToCloudinary(file, folder);
      onUploaded(url, publicId);
      toast.success('Imagen subida');
    } catch (e: any) {
      toast.error(e?.message ?? 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed cursor-pointer transition-colors',
        compact ? 'p-4 gap-1.5' : 'p-6 gap-2',
        dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/40',
        uploading && 'pointer-events-none opacity-70',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <span className={cn('flex items-center justify-center rounded-full bg-orange-100 text-orange-600', compact ? 'h-9 w-9' : 'h-12 w-12')}>
        {uploading ? <Loader2 className={cn('animate-spin', compact ? 'h-4 w-4' : 'h-5 w-5')} /> : <UploadCloud className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />}
      </span>
      <p className={cn('font-medium text-gray-700', compact ? 'text-xs' : 'text-sm')}>
        {uploading ? 'Subiendo…' : label}
      </p>
      {!compact && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
