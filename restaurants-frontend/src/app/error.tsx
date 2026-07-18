'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">500 - Error del servidor</h2>
      <p className="text-gray-500 mb-4">Ocurrió un error inesperado.</p>
      <p className="text-red-500 bg-red-100 p-4 rounded mb-4 font-mono text-sm max-w-2xl overflow-auto">{error.message}</p>
      <button onClick={() => reset()} className="px-4 py-2 bg-orange-500 text-white rounded-lg">
        Reintentar
      </button>
    </div>
  );
}
