"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, UserPlus, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginClientePage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (email.toLowerCase().endsWith('@guor.com')) {
        throw new Error('Las cuentas corporativas deben ingresar por el Portal Administrativo.');
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Credenciales inválidas');

      const role = data.role?.toLowerCase().trim();

      // Sincroniza los estados del enrutador de Next.js antes de mover la ventana
      router.refresh();

      if (role === 'cliente') {
        router.push('/portal/dashboard');
      }

    } catch (err: any) {
      setError(err.message);
      setLoading(false); // Detiene el spinner de carga si falló
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 bg-[#fbddd3] rounded-[3rem] shadow-2xl overflow-hidden border border-[#e4c28a]">

      {/* IZQUIERDA CON IMAGEN */}
      <div
        className="p-12 text-white flex flex-col justify-center relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: "url('/imagen-fondo.jpeg')"
        }}
      >
        {/* OVERLAY OSCURO (para que el texto se vea bien) */}
        <div className="absolute inset-0 bg-[#231e1d]/75"></div>

        {/* CONTENIDO */}
        <div className="relative z-10">



          <span className="bg-[#b5854b] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mb-6">
            Beneficio Exclusivo B2B
          </span>

          <h2 className="text-5xl font-serif italic leading-tight mb-4">
            ¡Bienvenido a la <br />
            <span className="not-italic font-black text-6xl text-[#e4c28a]">Familia!</span>
          </h2>

          <p className="text-white/70 font-medium text-sm leading-relaxed mb-8">
            Regístrate hoy como socio estratégico y obtén un{" "}
            <span className="text-[#e4c28a] font-black">20% de descuento</span> en tu primera orden.
          </p>

          <Link
            href="/registro-cliente"
            className="flex items-center gap-3 text-sm font-black uppercase tracking-widest bg-[#b5854b] text-white px-8 py-4 rounded-2xl w-fit hover:bg-[#e4c28a] hover:text-[#231e1d] transition shadow-lg"
          >
            <UserPlus size={18} /> Crear Cuenta
          </Link>

        </div>
      </div>

      {/* FORM */}
      <div className="p-12 bg-[#fff4e2] flex flex-col justify-center">

        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-black text-[#231e1d] tracking-tighter italic">
            Iniciar Sesión
          </h1>
          <p className="text-[#231e1d]/50 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
            Portal de Socios GUOR
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#fbddd3] border border-[#e4c28a] text-[#231e1d] text-[11px] font-bold rounded-2xl flex items-center gap-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">

          {/* EMAIL */}
          <div className="group">
            <label className="text-[10px] font-black text-[#231e1d]/50 uppercase tracking-widest ml-1">
              Email de Socio
            </label>

            <div className="relative mt-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#231e1d]/30 group-focus-within:text-[#b5854b]" size={18} />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="socio@empresa.com"
                className="w-full pl-12 pr-4 py-4 bg-[#fbddd3] border border-[#e4c28a] rounded-2xl text-sm outline-none focus:border-[#b5854b] transition font-bold text-[#231e1d]"
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="group">
            <label className="text-[10px] font-black text-[#231e1d]/50 uppercase tracking-widest ml-1">
              Clave de Acceso
            </label>

            <div className="relative mt-1">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#231e1d]/30 group-focus-within:text-[#b5854b]" size={18} />

              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 bg-[#fbddd3] border border-[#e4c28a] rounded-2xl text-sm outline-none focus:border-[#b5854b] transition font-bold text-[#231e1d]"
                required
              />

              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#231e1d]/40 hover:text-[#b5854b]"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Link
            href="/recuperar-password"
            className="block text-[10px] font-black text-[#b5854b] uppercase hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-5 bg-[#231e1d] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#b5854b] transition flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Entrar al Portal"}
          </button>

        </form>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-[10px] font-black text-[#231e1d]/50 uppercase hover:text-[#b5854b]"
          >
            <ArrowLeft className="inline-block text-center " size={14} /> Volver a la página principal
          </Link>
        </div>

      </div>
    </div>
  );
}