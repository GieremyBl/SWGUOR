'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2, Mail, Lock, User,
  ArrowRight, Loader2, CheckCircle2, AlertCircle,
  Phone, MapPin
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
          data: {
            full_name: formData.get('razonSocial'),
            ruc: formData.get('ruc'),
            phone: formData.get('telefono'),
            address: formData.get('direccion'),
            user_role: 'cliente',
          },
        },
      });

      if (authError) throw authError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─── ÉXITO ──────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F5EE] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-stone-100 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">¡Solicitud Enviada!</h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            Hemos recibido tus datos comerciales. Revisa tu correo para confirmar tu cuenta y esperar la validación de nuestro equipo.
          </p>
          <Link
            href="/auth/login"
            className="block w-full py-4 bg-[#C9A84C] text-white rounded-2xl font-bold text-sm hover:bg-[#B8860B] transition-all shadow-md"
          >
            Volver al Login
          </Link>
        </div>
      </div>
    );
  }

  /* ─── FORMULARIO ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex">

      {/* ── Columna izquierda: imagen + branding ── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Imagen de fondo */}
        <Image 
          src="/blurred-background-woman-looking-clothes.jpg" 
          alt="Fondo Textil Guor"
          fill
          priority
          className="object-cover z-0"
        />

        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Image src="/logo.png" alt="Logo Guor" width={40} height={40} className="rounded-lg" />
          </div>
        </div>

        {/* Texto central */}
        <div className="relative z-10 space-y-4">
          <p className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase">Portal Central</p>
          <h1 className="text-5xl font-black text-white leading-none tracking-tight">GUOR</h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Plataforma integral conectando producción textil mayorista con socios comerciales estratégicos.
          </p>
        </div>

        {/* Redes sociales */}
        <div className="relative z-10 flex items-center gap-5">
          <a href="#" aria-label="Facebook" className="text-white/50 hover:text-white transition-colors">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a href="#" aria-label="Instagram" className="text-white/50 hover:text-white transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>

      {/* ── Columna derecha: formulario ── */}
      <div className="flex-1 bg-[#F8F5EE] flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-lg">

          {/* Encabezado mobile: logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-stone-100">
              <Image src="/logo.png" alt="Logo Guor" width={40} height={40} className="rounded-lg" />
            </div>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-stone-900 tracking-tight">Crear Cuenta</h2>
            <p className="text-stone-500 text-sm mt-2">
              Únete a{' '}
              <span className="text-[#C9A84C] font-bold">Guor Pro Textil</span>{' '}
              para acceder a precios mayoristas y gestión de producción.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Razón Social */}
            <div className="relative group">
              <Building2
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#C9A84C] transition-colors"
              />
              <input
                name="razonSocial"
                required
                placeholder="Razón Social / Nombre de la Empresa"
                className="input-field"
              />
            </div>

            {/* RUC + Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative group">
                <User
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#C9A84C] transition-colors"
                />
                <input
                  name="ruc"
                  required
                  maxLength={11}
                  placeholder="Número de RUC"
                  className="input-field"
                />
              </div>
              <div className="relative group">
                <Phone
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#C9A84C] transition-colors"
                />
                <input
                  name="telefono"
                  required
                  type="tel"
                  placeholder="Teléfono de Contacto"
                  className="input-field"
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="relative group">
              <MapPin
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#C9A84C] transition-colors"
              />
              <input
                name="direccion"
                required
                placeholder="Dirección Fiscal Completa"
                className="input-field"
              />
            </div>

            {/* Email */}
            <div className="relative group">
              <Mail
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#C9A84C] transition-colors"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Correo Electrónico Corporativo"
                className="input-field"
              />
            </div>

            {/* Contraseña */}
            <div className="relative group">
              <Lock
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#C9A84C] transition-colors"
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Contraseña de Acceso"
                className="input-field"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 bg-[#C9A84C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#B8860B] transition-all shadow-lg shadow-amber-200/40 flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Solicitar Acceso B2B
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-stone-200 text-center">
            <p className="text-[11px] text-stone-400 font-bold tracking-wider uppercase">
              ¿Ya tienes una cuenta activa?{' '}
              <Link
                href="/auth/login"
                className="text-[#B8860B] hover:text-[#C9A84C] transition-colors underline underline-offset-4"
              >
                Iniciar Sesión
              </Link>
            </p>
          </div>

        </div>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.9rem 1rem 0.9rem 3rem;
          background-color: #ffffff;
          border: 1px solid #e7e5e4;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1c1917;
          outline: none;
          transition: all 0.2s ease;
        }
        .input-field::placeholder {
          color: #a8a29e;
          font-weight: 400;
        }
        .input-field:focus {
          border-color: #C9A84C;
          box-shadow: 0 0 0 4px rgba(201, 168, 76, 0.08);
        }
      `}</style>
    </div>
  );
}