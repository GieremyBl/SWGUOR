'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Lock, Mail, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      const role = data.role.toLowerCase();

      if (role === 'cliente') {
        window.location.href = '/portal/dashboard';
      } else if ([
        'administrador', 
        'cortador', 
        'diseñador', 
        'recepcionista', 
        'ayudante', 
        'representante_taller', 
        'gerente'
      ].includes(role)) {
        window.location.href = '/admin/Panel-Administrativo/dashboard';
      } else {
        throw new Error('Rol no reconocido por el sistema.');
      }

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Variantes de animación
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const socialIconVariants: Variants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  return (
    // Contenedor principal: Flex para dividir la pantalla en dos columnas
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-[#FFF9F2]">
      
      {/* =========================================
        SECCIÓN A: IMAGEN Y MARCA (Columna Izquierda)
        =========================================
      */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-start p-10 lg:p-20 text-center lg:text-left min-h-[40vh] lg:min-h-screen"
      >
        {/* Imagen de fondo desenfocada */}
        <Image 
          src="/blurred-background-woman-looking-clothes.jpg" 
          alt="Fondo Textil Guor"
          fill
          priority
          className="object-cover z-0"
        />
        {/* Overlay oscuro para garantizar legibilidad del texto blanco */}
        <div className="absolute inset-0 bg-stone-900/60 z-0"></div>

        {/* Contenido sobre la imagen */}
        <div className="relative z-10 max-w-xl w-full flex flex-col items-center lg:items-start">
          {/* Logo wrapper */}
          <motion.div variants={itemVariants} className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-10 shadow-2xl mx-auto lg:mx-0">
            <Image 
              src="/logo.png" 
              alt="Logo Guor"
              width={60}
              height={60}
              className="rounded-xl object-contain"
            />
          </motion.div>
          
          {/* Títulos de marca (Ahora en blanco para contrastar con el fondo oscuro) */}
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-serif text-white leading-tight">
            Portal Central <br />
            <span className="text-white font-sans font-black tracking-tighter uppercase text-5xl md:text-6xl mt-2 block drop-shadow-md">GUOR</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="mt-8 text-stone-200 text-base leading-relaxed max-w-lg mx-auto lg:mx-0">
            Plataforma integral conectando producción textil mayorista con socios comerciales estratégicos.
          </motion.p>

          {/* Iconos de redes sociales en blanco */}
          <motion.div variants={itemVariants} className="mt-12 flex gap-5 justify-center lg:justify-start">
            {/* Facebook - Enlace actualizado */}
            <motion.a 
              variants={socialIconVariants} 
              href="https://www.facebook.com/share/18ZangYR1J/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[#D4AF37] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </motion.a>
            {/* Instagram - Enlace actualizado */}
            <motion.a 
              variants={socialIconVariants} 
              href="https://www.instagram.com/giobrand.pe?igsh=MTZzZHNkMXc3cDZo" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[#D4AF37] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </motion.a>
          </motion.div>
        </div>
      </motion.div>

      {/* =========================================
        SECCIÓN B: FORMULARIO (Columna Derecha)
        =========================================
      */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full lg:w-1/2 flex flex-col justify-center items-center p-10 lg:p-20 bg-[#FFF9F2] relative z-10"
      >
        {/* Patrón sutil solo para el área del formulario */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
            backgroundSize: '30px 30px' 
          }} 
        />

        <div className="w-full max-w-md relative z-10">
          <motion.div variants={itemVariants} className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Iniciar Sesión</h1>
            <p className="text-stone-500 text-sm mt-2 font-medium">
              Ingrese sus credenciales para acceder a su panel.
            </p>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-6 w-full">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3">
                    <AlertCircle size={18} className="shrink-0" />
                    <p>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="space-y-5">
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#D4AF37] transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo Electrónico Corporativo / Cliente"
                  className="w-full pl-14 pr-6 py-5 bg-white border-stone-200 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all font-medium text-stone-800 placeholder:text-stone-400 shadow-sm"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#D4AF37] transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full pl-14 pr-6 py-5 bg-white border-stone-200 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all font-medium text-stone-800 placeholder:text-stone-400 shadow-sm"
                />
              </div>
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              className="w-full py-5 bg-[#0A0A0A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#D4AF37] hover:shadow-[#D4AF37]/20 transition-all duration-300 shadow-lg shadow-stone-200 flex items-center justify-center gap-3 group disabled:opacity-70 disabled:hover:bg-[#0A0A0A]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Acceder al Sistema
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Enlaces inferiores */}
          <motion.div variants={itemVariants} className="mt-16 space-y-6 w-full">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative bg-[#FFF9F2] px-4 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                Socios Comerciales B2B
              </div>
            </div>

            <p className="text-center text-sm text-stone-600 font-medium">
              ¿Desea solicitar acceso mayorista?{' '}
              <Link href="/auth/register" className="text-[#D4AF37] font-bold hover:text-[#B8860B] transition-colors underline-offset-4 hover:underline">
                Crear cuenta de cliente
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>

    </div>
  );
}