import { useState } from 'react';
import { Star, X } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { score: number; comment: string; foodScore: number; serviceScore: number; ambianceScore: number }) => void;
  loading?: boolean;
}

export function RatingModal({ isOpen, onClose, onSubmit, loading }: RatingModalProps) {
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState('');
  
  const [foodScore, setFoodScore] = useState(0);
  const [serviceScore, setServiceScore] = useState(0);
  const [ambianceScore, setAmbianceScore] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) return;
    
    onSubmit({
      score,
      comment,
      foodScore: foodScore || score,
      serviceScore: serviceScore || score,
      ambianceScore: ambianceScore || score
    });
  };

  const renderStars = (value: number, setter: (val: number) => void, hoverValue?: number, hoverSetter?: (val: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setter(star)}
            onMouseEnter={() => hoverSetter?.(star)}
            onMouseLeave={() => hoverSetter?.(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${(hoverValue || value) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Dejar Reseña</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <label className="text-sm font-medium text-gray-700">Calificación General *</label>
            {renderStars(score, setScore, hoverScore, setHoverScore)}
            {score === 0 && <p className="text-xs text-red-500">Requerido</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Comida (Opcional)</span>
              <div className="scale-75 origin-right">{renderStars(foodScore, setFoodScore)}</div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Servicio (Opcional)</span>
              <div className="scale-75 origin-right">{renderStars(serviceScore, setServiceScore)}</div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ambiente (Opcional)</span>
              <div className="scale-75 origin-right">{renderStars(ambianceScore, setAmbianceScore)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Comentario</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none transition-shadow"
              rows={4}
              placeholder="¿Qué te pareció tu experiencia?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={score === 0 || loading}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm shadow-emerald-200"
            >
              {loading ? 'Enviando...' : 'Publicar Reseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
