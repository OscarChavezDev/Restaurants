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
        'flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300',
        compact ? 'p-6 py-8 gap-4' : 'p-8 py-12 gap-5',
        dragOver ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10' : 'border-gray-200 dark:border-neutral-700 hover:border-orange-400 dark:hover:border-orange-500/50 hover:bg-gray-50/50 dark:hover:bg-neutral-800/50',
        uploading && 'pointer-events-none opacity-70 scale-95',
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
      <span className={cn('flex items-center justify-center rounded-2xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 text-gray-700 dark:text-gray-300 shadow-sm transition-transform group-hover:scale-110 mb-2', compact ? 'h-14 w-14' : 'h-20 w-20')}>
        {uploading ? <Loader2 className={cn('animate-spin text-orange-500', compact ? 'h-6 w-6' : 'h-8 w-8')} /> : <UploadCloud className={cn('text-orange-500', compact ? 'h-6 w-6' : 'h-10 w-10')} />}
      </span>
      <p className={cn('font-extrabold text-gray-900 dark:text-white tracking-wide', compact ? 'text-base' : 'text-lg')}>
        {uploading ? 'Subiendo imagen…' : label}
      </p>
      {!compact && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{hint}</p>}
    </div>
  );
}
