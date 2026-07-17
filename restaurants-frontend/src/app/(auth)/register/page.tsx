'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  UtensilsCrossed, Loader2, ArrowLeft, ArrowRight, Eye, EyeOff,
  User, Store, CheckCircle2, MailCheck,
} from 'lucide-react';
import { authService, type RegisterOwnerDto } from '@/services/authService';
import { GoogleLoginButton } from '@/components/ui/GoogleLoginButton';

const PWD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=cuenta, 1=restaurante
  const [done, setDone] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Datos del dueño
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Datos del restaurante
  const [rName, setRName] = useState('');
  const [rDesc, setRDesc] = useState('');
  const [rAddress, setRAddress] = useState('');
  const [rDistrict, setRDistrict] = useState('');
  const [rCity, setRCity] = useState('Tingo María');
  const [rRegion, setRRegion] = useState('Huánuco');
  const [rPhone, setRPhone] = useState('');
  const [rRuc, setRRuc] = useState('');
  const [rCapacity, setRCapacity] = useState('40');
  const [rPrice, setRPrice] = useState('2');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: RegisterOwnerDto) => authService.registerOwner(data),
    onSuccess: () => setDone(true),
    onError: (err: { response?: { data?: { message?: string; data?: Record<string, string> } } }) => {
      const fieldErrs = err?.response?.data?.data;
      if (fieldErrs && typeof fieldErrs === 'object') setErrors(fieldErrs);
      toast.error(err?.response?.data?.message ?? 'No se pudo enviar la solicitud');
    },
  });

  const validateStep0 = () => {
    const e: Record<string, string> = {};
    if (fullName.trim().length < 2) e.fullName = 'Ingresa tu nombre completo';
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Correo inválido';
    if (!PWD_RE.test(password)) e.password = 'Mín. 8 caracteres con mayúscula, minúscula, número y símbolo';
    if (password !== confirm) e.confirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (rName.trim().length < 2) e.rName = 'Nombre del restaurante obligatorio';
    if (rAddress.trim().length < 3) e.rAddress = 'Dirección obligatoria';
    if (!rCity.trim()) e.rCity = 'Ciudad obligatoria';
    if (!rRegion.trim()) e.rRegion = 'Región obligatoria';
    if (!rCapacity || Number(rCapacity) < 1) e.rCapacity = 'Capacidad inválida';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload: RegisterOwnerDto = {
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      restaurant: {
        name: rName.trim(),
        ...(rDesc.trim() ? { description: rDesc.trim() } : {}),
        address: rAddress.trim(),
        ...(rDistrict.trim() ? { district: rDistrict.trim() } : {}),
        city: rCity.trim(),
        region: rRegion.trim(),
        ...(rPhone.trim() ? { phone: rPhone.trim() } : {}),
        ...(rRuc.trim() ? { ruc: rRuc.trim() } : {}),
        totalCapacity: Number(rCapacity),
        priceLevel: Number(rPrice),
      },
    };
    mutation.mutate(payload);
  };

  const inputCls = 'w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
  const errCls = 'text-xs text-red-500 mt-1';

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[460px] w-[460px] rounded-full bg-orange-400/20 blur-[120px]" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-selva-400/15 blur-3xl" />
      </div>

      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors shadow-sm">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 rounded-2xl bg-orange-500 blur-xl opacity-40" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 ring-1 ring-white/40 dark:ring-white/10">
              <UtensilsCrossed className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-50">Registra tu Restaurante</h1>
          <p className="mt-1.5 text-gray-500 dark:text-gray-400 text-sm">Solicita tu cuenta en la plataforma turística de Tingo María</p>
        </div>

        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-orange-900/[0.06] border border-gray-100 dark:border-gray-700 p-7">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-600 to-selva-500" />

          {done ? (
            <SuccessScreen email={email} onGoLogin={() => router.push('/login')} />
          ) : (
            <>
              {/* Stepper */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <StepDot active={step >= 0} done={step > 0} icon={<User className="h-4 w-4" />} label="Tu cuenta" />
                <span className="h-px w-8 bg-gray-200 dark:bg-gray-600" />
                <StepDot active={step >= 1} done={false} icon={<Store className="h-4 w-4" />} label="Tu restaurante" />
              </div>

              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Nombre completo</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" className={inputCls} />
                    {errors.fullName && <p className={errCls}>{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Correo electrónico</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tu@email.com" className={inputCls} />
                    {errors.email && <p className={errCls}>{errors.email}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Teléfono <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 962000000" className={inputCls} />
                    {errors.phone && <p className={errCls}>{errors.phone}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Contraseña</label>
                    <div className="relative">
                      <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPwd ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" className={`${inputCls} pr-10`} />
                      <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className={errCls}>{errors.password}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Confirmar contraseña</label>
                    <div className="relative">
                      <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type={showConfirm ? 'text' : 'password'} placeholder="Repite tu contraseña" className={`${inputCls} pr-10`} />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirm && <p className={errCls}>{errors.confirm}</p>}
                  </div>

                  <button onClick={() => validateStep0() && setStep(1)} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all mt-1">
                    Continuar <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Nombre del restaurante</label>
                    <input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Ej: El Carbón Resto Bar" className={inputCls} />
                    {errors.rName && <p className={errCls}>{errors.rName}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                    <textarea value={rDesc} onChange={(e) => setRDesc(e.target.value)} rows={2} placeholder="Cuéntanos sobre tu restaurante" className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>Dirección</label>
                    <input value={rAddress} onChange={(e) => setRAddress(e.target.value)} placeholder="Av. / Jr. y número" className={inputCls} />
                    {errors.rAddress && <p className={errCls}>{errors.rAddress}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Distrito</label>
                      <input value={rDistrict} onChange={(e) => setRDistrict(e.target.value)} placeholder="Distrito" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Ciudad</label>
                      <input value={rCity} onChange={(e) => setRCity(e.target.value)} className={inputCls} />
                      {errors.rCity && <p className={errCls}>{errors.rCity}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Región</label>
                      <input value={rRegion} onChange={(e) => setRRegion(e.target.value)} className={inputCls} />
                      {errors.rRegion && <p className={errCls}>{errors.rRegion}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Teléfono <span className="text-gray-400 font-normal">(opc.)</span></label>
                      <input value={rPhone} onChange={(e) => setRPhone(e.target.value)} placeholder="Ej: 962000000" className={inputCls} />
                      {errors['restaurant.phone'] && <p className={errCls}>{errors['restaurant.phone']}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>RUC <span className="text-gray-400 font-normal">(opc.)</span></label>
                      <input value={rRuc} onChange={(e) => setRRuc(e.target.value)} placeholder="11 dígitos" className={inputCls} />
                      {errors['restaurant.ruc'] && <p className={errCls}>{errors['restaurant.ruc']}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Capacidad</label>
                      <input value={rCapacity} onChange={(e) => setRCapacity(e.target.value)} type="number" min={1} className={inputCls} />
                      {errors.rCapacity && <p className={errCls}>{errors.rCapacity}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Precio</label>
                      <select value={rPrice} onChange={(e) => setRPrice(e.target.value)} className={inputCls}>
                        <option value="1">$ Económico</option>
                        <option value="2">$$ Medio</option>
                        <option value="3">$$$ Alto</option>
                        <option value="4">$$$$ Premium</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => setStep(0)} className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                      <ArrowLeft className="h-4 w-4" /> Atrás
                    </button>
                    <button onClick={submit} disabled={mutation.isPending} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all">
                      {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : 'Enviar solicitud'}
                    </button>
                  </div>
                </div>
              )}

              {/* Separador + cliente con Google */}
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400">o</span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4 text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">¿Vas a reservar como cliente?</p>
                <div className="flex justify-center">
                  <GoogleLoginButton text="signup_with" onSuccess={(u) => router.push(u.role === 'CLIENTE' ? '/restaurants' : '/dashboard')} />
                </div>
                <p className="mt-2 text-xs text-gray-400">Los clientes se registran con Google para reservar, guardar favoritos y reseñar.</p>
              </div>

              <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">Inicia sesión</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDot({ active, done, icon, label }: { active: boolean; done: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${active ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : icon}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

function SuccessScreen({ email, onGoLogin }: { email: string; onGoLogin: () => void }) {
  return (
    <div className="text-center py-4">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-selva-100 text-selva-600 dark:bg-selva-900/30 dark:text-selva-400">
        <MailCheck className="h-8 w-8" />
      </div>
      <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-50">¡Solicitud recibida!</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        Tu cuenta está <strong>en revisión</strong>. Verificaremos los datos de tu restaurante y te enviaremos un
        correo a <strong className="text-gray-700 dark:text-gray-200">{email}</strong> cuando sea aprobada.
        Hasta entonces, aún no podrás iniciar sesión.
      </p>
      <button onClick={onGoLogin} className="mt-6 w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all">
        Entendido
      </button>
    </div>
  );
}
