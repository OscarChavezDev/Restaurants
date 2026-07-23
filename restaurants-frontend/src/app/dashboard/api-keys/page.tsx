'use client';

import { useState } from 'react';
import { KeyRound, Plus, Trash2, Copy, Check, X, Loader2, AlertTriangle, Terminal, RefreshCw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApiKeys, useGenerateApiKey, useRevokeApiKey, useRegenerateApiKey } from '@/hooks/useApiKeys';

const CodeSnippet = ({ title, code }: { title: string; code: string }) => {
  const [copiedLocal, setCopiedLocal] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopiedLocal(true);
    setTimeout(() => setCopiedLocal(false), 2000);
  };
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden relative group">
      <div className="bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        {title}
        <button onClick={handleCopy} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Copiar código">
          {copiedLocal ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono bg-white dark:bg-gray-800 overflow-hidden whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200">
        {code}
      </pre>
    </div>
  );
};

export default function ApiKeysPage() {
  const { data: keys, isLoading } = useApiKeys();
  const generateMutation = useGenerateApiKey();
  const revokeMutation = useRevokeApiKey();
  const regenerateMutation = useRegenerateApiKey();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<{ rawKey: string; keyPrefix: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    { type: 'revoke' | 'regenerate'; id: string; name: string } | null
  >(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

  const handleGenerate = () => {
    if (!newKeyName.trim()) return;
    generateMutation.mutate(newKeyName.trim(), {
      onSuccess: (data) => {
        setCreatedKey({ rawKey: data.rawKey, keyPrefix: data.keyPrefix, name: data.name });
        setNewKeyName('');
      },
      onError: () => toast.error('No se pudo generar la clave. Intenta de nuevo.'),
    });
  };

  const runConfirmedAction = () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    if (type === 'revoke') {
      revokeMutation.mutate(id, {
        onSuccess: () => toast.success('Clave revocada'),
        onError: () => toast.error('No se pudo revocar la clave'),
      });
    } else {
      regenerateMutation.mutate(id, {
        onSuccess: (data) => {
          setCreatedKey({ rawKey: data.rawKey, keyPrefix: data.keyPrefix, name: data.name });
          setShowCreateModal(true);
          toast.success('Clave regenerada');
        },
        onError: () => toast.error('No se pudo regenerar la clave'),
      });
    }
    setConfirmAction(null);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeCreateFlow = () => {
    setShowCreateModal(false);
    setCreatedKey(null);
    setCopied(false);
  };

  return (
    <div className="relative min-h-[85vh] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Ambient glows (Premium Theme) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full bg-orange-500/10 dark:bg-orange-600/15 blur-[130px]" />
        <div className="absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full bg-rose-400/10 dark:bg-rose-500/10 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-50">API Keys</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Genera claves para consumir el catálogo de restaurantes desde tu propio sistema.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <Plus className="h-4 w-4" /> Generar nueva clave
        </button>
      </div>

      {/* Lista de keys */}
      <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-xl overflow-hidden mb-8">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : !keys?.length ? (
          <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
            {/* Ambient glow behind icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[60px] pointer-events-none" />
            
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 mb-6 shadow-xl shadow-orange-900/5">
              <KeyRound className="h-10 w-10 text-orange-600 dark:text-orange-400" />
            </div>
            
            <h3 className="relative z-10 text-xl font-bold text-gray-900 dark:text-white mb-2">No tienes claves activas</h3>
            <p className="relative z-10 text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm leading-relaxed mb-6">
              Genera tu primera API key para comenzar a integrar el catálogo de restaurantes de RestoPoint en tu propia plataforma o aplicación.
            </p>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="relative z-10 inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" /> Crear mi primera clave
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Clave</th>
                  <th className="px-5 py-3">Creada</th>
                  <th className="px-5 py-3">Último uso</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">{k.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500 dark:text-gray-400">{k.keyPrefix}••••••••••••</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{new Date(k.createdAt).toLocaleDateString('es-PE')}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('es-PE') : 'Nunca'}
                    </td>
                    <td className="px-5 py-3.5">
                      {k.revoked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Revocada</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-selva-100 text-selva-700">Activa</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      {!k.revoked && (
                        <>
                          <button
                            onClick={() => setConfirmAction({ type: 'regenerate', id: k.id, name: k.name })}
                            disabled={regenerateMutation.isPending}
                            title="Revoca esta clave y crea una nueva con el mismo nombre"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Regenerar
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'revoke', id: k.id, name: k.name })}
                            disabled={revokeMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Revocar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Documentación Compacta (Bento Grid) */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intro y Autenticación */}
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-xl p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="h-6 w-6 text-orange-500" />
              <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-50">Uso de la API</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Envía tu clave en el header <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-900 font-mono text-xs text-orange-600 dark:text-orange-400">X-API-Key</code> en cada solicitud. Límite: 60 req/min.
            </p>
            <div className="space-y-4">
              <CodeSnippet
                title="Listar restaurantes (GET)"
                code={`curl "${apiBaseUrl}/v1/developer-api/restaurants" \\\n  -H "X-API-Key: rp_live_..."`}
              />
              <CodeSnippet
                title="Detalle restaurante (GET)"
                code={`curl "${apiBaseUrl}/v1/developer-api/restaurants/{id}" \\\n  -H "X-API-Key: rp_live_..."`}
              />
              <CodeSnippet
                title="Marcar mesa ocupada/libre (PATCH, tu propio restaurante)"
                code={`curl -X PATCH "${apiBaseUrl}/v1/restaurants/{tuRestaurantId}/tables/{tableId}/status?status=OCCUPIED" \\\n  -H "X-API-Key: rp_live_..."`}
              />
            </div>
          </div>

          {/* Datos y Ubicación */}
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-xl p-6 lg:p-8 flex flex-col">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-900/10 dark:to-rose-900/10 border border-orange-100 dark:border-orange-900/30 mb-6">
              <KeyRound className="h-6 w-6 text-orange-600 dark:text-orange-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">Ubicación Precisa</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  Ambos endpoints incluyen <code className="font-mono bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded text-xs">latitude</code> y <code className="font-mono bg-white/60 dark:bg-black/20 px-1.5 py-0.5 rounded text-xs">longitude</code> reales. No hace falta geocodificar, úsalas directo.
                </p>
              </div>
            </div>
            
            <div className="flex-1">
              <CodeSnippet
                title="Ejemplo de respuesta (JSON)"
                code={`{\n  "success": true,\n  "data": {\n    "content": [\n      {\n        "id": "a1b2c3d4...",\n        "name": "El Fogón de la Selva",\n        "latitude": -9.2953,\n        "longitude": -75.9975,\n        "avgRating": 4.6\n      }\n    ]\n  }\n}`}
              />
            </div>
          </div>
        </div>

        {/* Lo que puedes hacer */}
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-xl p-6 lg:p-8">
          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            ¿Qué puedes hacer con esto?
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <strong className="text-gray-900 dark:text-white text-sm block">1. Ponerlo en un mapa</strong>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pinta los restaurantes en Google Maps, Leaflet o Mapbox usando las coordenadas exactas que enviamos en la respuesta.
              </p>
            </div>
            <div className="space-y-2">
              <strong className="text-gray-900 dark:text-white text-sm block">2. Calcular distancias</strong>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Trae la lista completa y usa la fórmula de Haversine en tu app para ordenarlos por cercanía al usuario.
              </p>
            </div>
            <div className="space-y-3 md:col-span-2">
              <strong className="text-gray-900 dark:text-white text-sm block">3. Generar rutas</strong>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Crea botones de "Cómo llegar" armando la URL nativa:
              </p>
              <CodeSnippet
                title="Link"
                code="https://www.google.com/maps?q=${latitude},${longitude}"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Modal: generar / mostrar clave */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
                {createdKey ? 'Tu nueva API key' : 'Generar nueva clave'}
              </h2>
              {!createdKey && (
                <button
                  onClick={closeCreateFlow}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-6">
              {!createdKey ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nombre de la clave
                  </label>
                  <input
                    autoFocus
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Ej. Integración producción"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition mb-5"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={!newKeyName.trim() || generateMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all"
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
                    ) : (
                      'Generar clave'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Guarda esta clave ahora — no podrás volver a verla completa nunca más.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-5">
                    <code className="flex-1 px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-900 font-mono text-xs text-gray-800 dark:text-gray-200 break-all">
                      {createdKey.rawKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdKey.rawKey)}
                      className="shrink-0 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                      title="Copiar"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <button
                    onClick={closeCreateFlow}
                    className="w-full py-3 px-4 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 font-semibold rounded-xl transition-all"
                  >
                    Ya la guardé, cerrar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar revocar / regenerar */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-5">
                <div
                  className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-full ${
                    confirmAction.type === 'revoke'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                  }`}
                >
                  {confirmAction.type === 'revoke' ? (
                    <Trash2 className="h-5 w-5" />
                  ) : (
                    <RefreshCw className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">
                    {confirmAction.type === 'revoke' ? 'Revocar clave' : 'Regenerar clave'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {confirmAction.type === 'revoke' ? (
                      <>
                        La clave <strong className="text-gray-800 dark:text-gray-200">"{confirmAction.name}"</strong> dejará
                        de funcionar de inmediato. No se puede deshacer.
                      </>
                    ) : (
                      <>
                        La clave actual de <strong className="text-gray-800 dark:text-gray-200">"{confirmAction.name}"</strong>{' '}
                        dejará de funcionar de inmediato y se reemplaza por una nueva.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={runConfirmedAction}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-colors ${
                    confirmAction.type === 'revoke'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {confirmAction.type === 'revoke' ? 'Revocar' : 'Regenerar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
