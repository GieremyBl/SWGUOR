'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, Mail, Lock, User, 
  ArrowRight, Loader2, CheckCircle2, AlertCircle,
  Phone, MapPin, Eye, EyeOff
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Componente: El Hilo Dorado (Fondo Animado)
 * Mantenemos este componente para dar coherencia con el Login.
 */
const GoldenThreadBackground = () => (
  <div className="fixed inset-0 -z-10 bg-[#FFF9F2] overflow-hidden">
    <svg 
      className="absolute w-full h-full"
      viewBox="0 0 1440 900" 
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M-100,450 C200,300 400,600 700,450 C1000,300 1200,600 1540,450"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="1.5"
        className="animate-thread-flow opacity-40"
      />
      <path
        d="M-100,460 C250,350 450,550 720,460 C950,370 1150,550 1540,460"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="0.5"
        className="animate-thread-flow-slow opacity-20"
      />
    </svg>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,#D4AF37/5_0%,transparent_70%)]" />
  </div>
);

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
          data: {
            full_name: formData.get('razonSocial'),
            ruc: formData.get('ruc'),
            phone: formData.get('telefono'),
            address: formData.get('direccion'),
            user_role: 'cliente'
          }
        }
      });

      if (authError) throw authError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
        <GoldenThreadBackground />
        <div className="max-w-md w-full bg-white/80 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-2xl border border-white text-center space-y-6 relative z-10 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-100">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">¡Solicitud Enviada!</h2>
          <p className="text-stone-500 text-sm leading-relaxed font-medium">
            Hemos recibido los datos de su empresa. Por favor, **revise su correo corporativo** para confirmar su cuenta y esperar la validación del equipo **GUOR**.
          </p>
          <Link href="/auth/login" className="flex items-center justify-center gap-3 w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl">
            Volver al Inicio de Sesión <ArrowRight size={16} className="text-[#D4AF37]" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-10 overflow-hidden">
      <GoldenThreadBackground />
      
      <div className="max-w-4xl w-full bg-white/70 backdrop-blur-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-white relative z-10 grid grid-cols-1 md:grid-cols-5">
        
        {/* Lado Decorativo (Branding) */}
        <div className="hidden md:flex md:col-span-2 bg-[#1A1A1A] p-10 flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-8 shadow-xl">
              <Image src="/logo.png" alt="Logo Guor" width={40} height={40} priority />
            </div>
            <h2 className="text-3xl font-serif italic leading-tight">
              Excelencia en <br />
              <span className="text-[#D4AF37] not-italic font-sans font-black tracking-tighter uppercase text-4xl">Textiles B2B</span>
            </h2>
            <p className="mt-8 text-stone-400 text-sm leading-relaxed font-medium border-l-2 border-[#D4AF37] pl-4">
              Únete a nuestra red mayorista para gestionar pedidos y cotizaciones con soporte inteligente.
            </p>
          </div>
          <p className="relative z-10 text-[9px] text-stone-500 font-bold uppercase tracking-widest">
            © 2026 Modas y Estilos GUOR S.A.C.
          </p>
        </div>

        {/* Lado del Formulario */}
        <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center bg-white/30">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">Registro de Socio</h1>
            <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
              Optimización del proceso de cotización
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50/80 border border-red-100 text-red-600 text-[10px] font-black rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error.toUpperCase()}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                <input name="razonSocial" required placeholder="RAZÓN SOCIAL / EMPRESA" className="register-input" />
              </div>

              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                <input name="ruc" required maxLength={11} placeholder="NÚMERO DE RUC" className="register-input" />
              </div>

              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                <input name="telefono" required type="tel" placeholder="TELÉFONO" className="register-input" />
              </div>

              <div className="md:col-span-2 relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                <input name="direccion" required placeholder="DIRECCIÓN FISCAL COMPLETA" className="register-input" />
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                <input name="email" type="email" required placeholder="CORREO CORPORATIVO" className="register-input" />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-[#D4AF37] transition-colors" size={18} />
                <input 
                  name="password" 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  placeholder="CONTRASEÑA" 
                  className="register-input pr-12" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-[#D4AF37] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full py-4 mt-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 group"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Solicitar Acceso B2B <ArrowRight size={16} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-stone-100 pt-6">
            <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">
              ¿Ya tiene una cuenta?{' '}
              <Link href="/auth/login" className="text-[#B8860B] hover:text-[#D4AF37] transition-colors underline decoration-[#D4AF37] underline-offset-4">
                Iniciar Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .register-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3.5rem;
          background-color: rgba(255, 255, 255, 0.6);
          border: 1px solid #f5f5f4;
          border-radius: 1.25rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #1c1917;
          outline: none;
          transition: all 0.3s ease;
          letter-spacing: 0.025em;
        }
        .register-input::placeholder {
          color: #d6d3d1;
          font-weight: 600;
        }
        .register-input:focus {
          border-color: #D4AF37;
          background-color: white;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.08);
        }
      `}</style>
    </div>
  );
}