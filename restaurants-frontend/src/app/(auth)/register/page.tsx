'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Loader2, ArrowLeft, ArrowRight, Eye, EyeOff,
  User, Store, CheckCircle2, MailCheck, MapPin, Phone, Hash,
  Users, DollarSign, FileText, Mail, Lock, UtensilsCrossed,
} from 'lucide-react';
import { authService, type RegisterOwnerDto } from '@/services/authService';
// @ts-ignore
import ubigeo from 'ubigeo-peru';

const departments = ubigeo.reniec.filter((u: any) => u.provincia === '00' && u.distrito === '00');

const PWD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [rName, setRName] = useState('');
  const [rDesc, setRDesc] = useState('');
  const [rAddress, setRAddress] = useState('');
  const [rDepId, setRDepId] = useState('');
  const [rProvId, setRProvId] = useState('');
  const [rDistId, setRDistId] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rRuc, setRRuc] = useState('');
  const [rCapacity, setRCapacity] = useState('40');
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

  const provinces = rDepId ? ubigeo.reniec.filter((u: any) => u.departamento === rDepId && u.provincia !== '00' && u.distrito === '00') : [];
  const districts = (rDepId && rProvId) ? ubigeo.reniec.filter((u: any) => u.departamento === rDepId && u.provincia === rProvId && u.distrito !== '00') : [];

  const submit = () => {
    const e: Record<string, string> = {};
    if (rName.trim().length < 2) e.rName = 'Nombre del restaurante obligatorio';
    if (rAddress.trim().length < 3) e.rAddress = 'Dirección obligatoria';
    if (!rDepId) e.rDepId = 'Región obligatoria';
    if (!rProvId) e.rProvId = 'Ciudad obligatoria';
    if (!rCapacity || Number(rCapacity) < 1) e.rCapacity = 'Capacidad inválida';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    
    const depName = departments.find((d: any) => d.departamento === rDepId)?.nombre || '';
    const provName = provinces.find((p: any) => p.provincia === rProvId)?.nombre || '';
    const distName = districts.find((d: any) => d.distrito === rDistId)?.nombre || '';

    mutation.mutate({
      fullName: fullName.trim(), email: email.trim(), password,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      restaurant: {
        name: rName.trim(),
        ...(rDesc.trim() ? { description: rDesc.trim() } : {}),
        address: rAddress.trim(),
        ...(distName ? { district: distName } : {}),
        city: provName, region: depName,
        ...(rPhone.trim() ? { phone: rPhone.trim() } : {}),
        ...(rRuc.trim() ? { ruc: rRuc.trim() } : {}),
        totalCapacity: Number(rCapacity),
      },
    });
  };

  const field = 'w-full border border-gray-200 dark:border-gray-600/60 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-gray-700 transition';
  const label = 'block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5';
  const errCls = 'text-[11px] text-red-500 dark:text-red-400 mt-1 font-medium';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300">
      {/* Ambient glows — adapt to theme */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-orange-500/15 dark:bg-orange-600/25 blur-[130px]" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-orange-400/10 dark:bg-orange-400/15 blur-[130px]" />
        <div className="absolute top-1/2 -translate-y-1/2 -right-40 h-[400px] w-[400px] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">

        {done ? (
          <div className="text-center py-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-500/30">
              <MailCheck className="h-10 w-10 text-white" />
            </div>
            <h2 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white">Solicitud recibida</h2>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
              Tu restaurante está en revisión. Te notificaremos a{' '}
              <span className="text-orange-600 dark:text-orange-400 font-semibold">{email}</span>{' '}
              cuando sea aprobado (aprox. 24 h).
            </p>
            <button onClick={() => router.push('/login')}
              className="mt-7 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.02]">
              Ir al inicio de sesión
            </button>
          </div>
        ) : (
          <>
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600/60 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xs font-bold transition-all shadow-sm">
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio de sesión
              </Link>

              {/* Step indicator pills */}
              <div className="flex items-center gap-2.5">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${step === 0 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700/50'}`}>
                  {step > 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  Tu cuenta
                </div>
                <div className="h-px w-5 bg-gray-300 dark:bg-gray-600" />
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${step === 1 ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700'}`}>
                  <Store className="h-3.5 w-3.5" />
                  Restaurante
                </div>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-xl dark:shadow-2xl overflow-hidden">
              {/* Accent line */}
              <div className="h-[3px] w-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400" />

              <div className="p-7 sm:p-8">
                {/* Title */}
                <div className="mb-6">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-500/20 border border-orange-200 dark:border-orange-500/30">
                      <UtensilsCrossed className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">RestoPoint</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                    {step === 0 ? 'Crea tu cuenta' : 'Tu restaurante'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {step === 0 ? 'Paso 1 de 2 — datos del propietario' : 'Paso 2 de 2 — información del establecimiento'}
                  </p>
                </div>

                {/* STEP 0 */}
                {step === 0 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={label}>Nombre completo</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                            placeholder="Tu nombre" className={`${field} pl-10`} />
                        </div>
                        {errors.fullName && <p className={errCls}>{errors.fullName}</p>}
                      </div>
                      <div>
                        <label className={label}>Teléfono <span className="text-gray-400 normal-case font-normal">(opcional)</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={phone} onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ej: 962000000" className={`${field} pl-10`} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={label}>Correo electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={email} onChange={(e) => setEmail(e.target.value)}
                          type="email" placeholder="tu@email.com" className={`${field} pl-10`} />
                      </div>
                      {errors.email && <p className={errCls}>{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={label}>Contraseña</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={password} onChange={(e) => setPassword(e.target.value)}
                            type={showPwd ? 'text' : 'password'} placeholder="Mín. 8 caracteres"
                            className={`${field} pl-10 pr-10`} />
                          <button type="button" onClick={() => setShowPwd((v) => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password && <p className={errCls}>{errors.password}</p>}
                      </div>
                      <div>
                        <label className={label}>Confirmar contraseña</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={confirm} onChange={(e) => setConfirm(e.target.value)}
                            type={showConfirm ? 'text' : 'password'} placeholder="Repite tu contraseña"
                            className={`${field} pl-10 pr-10`} />
                          <button type="button" onClick={() => setShowConfirm((v) => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.confirm && <p className={errCls}>{errors.confirm}</p>}
                      </div>
                    </div>

                    <button onClick={() => validateStep0() && setStep(1)}
                      className="w-full flex items-center justify-center gap-2 py-3 mt-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all">
                      Continuar <ArrowRight className="h-4 w-4" />
                    </button>

                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                      ¿Ya tienes cuenta?{' '}
                      <Link href="/login" className="text-orange-600 dark:text-orange-400 font-bold hover:underline">
                        Inicia sesión
                      </Link>
                      {' · '}
                      <Link href="/register-developer" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">
                        Soy desarrollador
                      </Link>
                    </p>
                  </div>
                )}

                {/* STEP 1 */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={label}>Nombre del restaurante</label>
                        <div className="relative">
                          <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={rName} onChange={(e) => setRName(e.target.value)}
                            placeholder="Ej: El Carbón Resto Bar" className={`${field} pl-10`} />
                        </div>
                        {errors.rName && <p className={errCls}>{errors.rName}</p>}
                      </div>
                      <div>
                        <label className={label}>Teléfono <span className="text-gray-400 normal-case font-normal">(opcional)</span></label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={rPhone} onChange={(e) => setRPhone(e.target.value)}
                            placeholder="Ej: 062000000" className={`${field} pl-10`} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={label}>Descripción <span className="text-gray-400 normal-case font-normal">(opcional)</span></label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <textarea value={rDesc} onChange={(e) => setRDesc(e.target.value)} rows={2}
                          placeholder="Cuéntanos sobre tu restaurante…"
                          className={`${field} pl-10 resize-none`} />
                      </div>
                    </div>

                    <div>
                      <label className={label}>Dirección</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={rAddress} onChange={(e) => setRAddress(e.target.value)}
                          placeholder="Av. / Jr. y número" className={`${field} pl-10`} />
                      </div>
                      {errors.rAddress && <p className={errCls}>{errors.rAddress}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={label}>Departamento</label>
                        <select value={rDepId} onChange={(e) => { setRDepId(e.target.value); setRProvId(''); setRDistId(''); }} className={field}>
                          <option value="">Seleccione...</option>
                          {departments.map((d: any) => (
                            <option key={d.departamento} value={d.departamento}>{d.nombre}</option>
                          ))}
                        </select>
                        {errors.rDepId && <p className={errCls}>{errors.rDepId}</p>}
                      </div>
                      <div>
                        <label className={label}>Provincia</label>
                        <select value={rProvId} onChange={(e) => { setRProvId(e.target.value); setRDistId(''); }} className={field} disabled={!rDepId}>
                          <option value="">Seleccione...</option>
                          {provinces.map((p: any) => (
                            <option key={p.provincia} value={p.provincia}>{p.nombre}</option>
                          ))}
                        </select>
                        {errors.rProvId && <p className={errCls}>{errors.rProvId}</p>}
                      </div>
                      <div>
                        <label className={label}>Distrito</label>
                        <select value={rDistId} onChange={(e) => setRDistId(e.target.value)} className={field} disabled={!rProvId}>
                          <option value="">Seleccione...</option>
                          {districts.map((d: any) => (
                            <option key={d.distrito} value={d.distrito}>{d.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={label}>RUC <span className="text-gray-400 normal-case font-normal">(opc.)</span></label>
                        <div className="relative">
                          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={rRuc} onChange={(e) => setRRuc(e.target.value)}
                            placeholder="11 dígitos" className={`${field} pl-10`} />
                        </div>
                      </div>
                      <div>
                        <label className={label}>Capacidad</label>
                        <div className="relative">
                          <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input value={rCapacity} onChange={(e) => setRCapacity(e.target.value)}
                            type="number" min={1} className={`${field} pl-10`} />
                        </div>
                        {errors.rCapacity && <p className={errCls}>{errors.rCapacity}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => setStep(0)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl transition-all">
                        <ArrowLeft className="h-3.5 w-3.5" /> Atrás
                      </button>
                      <button onClick={submit} disabled={mutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all">
                        {mutation.isPending
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                          : 'Enviar solicitud de registro'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
