'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, Mail, Loader2, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Componente: El Hilo Dorado (La Conexión Digital)
 * Simula un hilo de seda dorado que fluye por la pantalla,
 * representando la integración del sistema ERP en la cadena textil.
 */
const GoldenThreadBackground = () => (
  <div className="fixed inset-0 -z-10 bg-[#FFF9F2] overflow-hidden">
    <svg 
      className="absolute w-full h-full"
      viewBox="0 0 1440 900" 
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hilo Principal con brillo */}
      <path
        d="M-100,450 C200,300 400,600 700,450 C1000,300 1200,600 1540,450"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.5"
        className="animate-thread-flow opacity-40"
      />
      {/* Segundo hilo sutil para profundidad */}
      <path
        d="M-100,460 C250,350 450,550 720,460 C950,370 1150,550 1540,460"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="0.5"
        className="animate-thread-flow-slow opacity-20"
      />
    </svg>
    
    {/* Brillo ambiental suave */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,#D4AF37/5_0%,transparent_70%)]" />
  </div>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirección por roles según el equipo del proyecto [cite: 34, 36]
      const role = data.role.toLowerCase();
      if (['administrador', 'recepcionista', 'disenador'].includes(role)) {
        router.push('/admin/Panel-Administrativo/dashboard');
      } else if (role === 'cliente') {
        router.push('/portal/dashboard');
      } else {
        throw new Error('Rol no reconocido por el sistema.');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      <GoldenThreadBackground />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden border border-white/50 relative z-10">
        
        {/* Lado Izquierdo: Branding de SWGUOR  */}
        <div className="hidden md:flex bg-[#1A1A1A] p-12 flex-col justify-between text-white relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-10 shadow-2xl transition-transform duration-700 group-hover:rotate-[5deg]">
              <Image src="/logo.png" alt="Logo Guor" width={48} height={48} priority />
            </div>
            <h2 className="text-4xl font-serif italic leading-[1.1]">
              Excelencia en <br />
              <span className="text-[#D4AF37] not-italic font-sans font-black tracking-tighter uppercase text-5xl">TEXTILES B2B</span>
            </h2>
            <p className="mt-8 text-stone-400 text-sm leading-relaxed max-w-[280px] font-medium">
              Acceda a su panel exclusivo para gestionar órdenes de producción, cotizaciones por volumen y catálogos premium.
            </p>
          </div>
          
          <div className="relative z-10 pt-10 border-t border-white/10">
             <p className="text-[10px] text-stone-500 font-bold tracking-[0.2em] uppercase">
               Modas y Estilos GUOR S.A.C.
             </p>
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="p-8 md:p-14 flex flex-col justify-center bg-white/30">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-stone-900 tracking-tight italic">Bienvenido</h1>
            <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
              Digital Weaving Interface
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50/80 border border-red-100 text-red-600 text-[11px] font-bold rounded-xl flex items-center gap-3 animate-pulse">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Usuario */}
              <div className="group">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Correo Corporativo</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@guor.com"
                    className="w-full pl-12 pr-4 py-4 bg-white/80 border border-stone-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password + Ojo */}
              <div className="group">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 bg-white/80 border border-stone-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#D4AF37] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 group disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  Entrar al Sistema
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-[#D4AF37]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <Link href="/auth/register" className="text-[10px] text-stone-400 font-bold uppercase tracking-widest hover:text-[#D4AF37] transition-colors">
              ¿Nueva cuenta B2B? <span className="text-[#D4AF37] ml-1">Contactar aquí</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}