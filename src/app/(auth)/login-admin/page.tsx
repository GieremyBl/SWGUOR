"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import GoldenThreadBackground from "@/components/auth/GoldenThreadBackground";

export default function LoginAdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email.toLowerCase().endsWith('@guor.com')) {
        throw new Error('Acceso restringido: Solo correos @guor.com');
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciales incorrectas');

      const role = data.role?.toLowerCase().trim();
      const staffRoles = ['gerente','administrador','recepcionista','disenador','cortador','ayudante','representante_taller', 'almacenero'];

      if (staffRoles.includes(role)) {
        router.push('/admin/Panel-Administrativo/dashboard');
      } else if (role === 'cliente') {
        router.push('/portal/dashboard');
      } else {
        throw new Error('Sin permisos');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">

      {/* BACKGROUND ANIMADO */}
      <GoldenThreadBackground />

      {/* CARD */}
      <div
        className="relative z-10 w-full max-w-md p-10 rounded-[2.5rem]"
        style={{
          background: "#fff4e2",
          border: "1px solid #e4c28a",
          boxShadow: "0 20px 60px rgba(35,30,29,0.1)"
        }}
      >

        {/* HEADER */}
        <div className="mb-8 text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md"
            style={{ background: "#231e1d", color: "#e4c28a" }}
          >
            <ShieldCheck size={28} />
          </div>

          <h1 className="text-2xl font-black uppercase" style={{ color: "#231e1d" }}>
            GUOR CORPORATIVO
          </h1>

          <p className="text-[10px] font-bold uppercase mt-1" style={{ color: "rgba(35,30,29,0.5)" }}>
            PANEL ADMINISTRATIVO GUOR
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div
            className="mb-6 p-4 text-[11px] font-bold rounded-2xl flex items-center gap-3"
            style={{ background: "#fbddd3", border: "1px solid #b5854b", color: "#b5854b" }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* EMAIL */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: "rgba(35,30,29,0.3)" }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Usuario Corporativo"
              required
              style={{
                width: "100%",
                padding: "1rem 1rem 1rem 3rem",
                background: "#fff4e2",
                border: "1px solid #e4c28a",
                borderRadius: "1rem",
                fontSize: "0.875rem",
                fontWeight: "700",
                color: "#231e1d",
                outline: "none",
                transition: "all 0.3s"
              }}
              onFocus={e => e.target.style.borderColor = "#b5854b"}
              onBlur={e => e.target.style.borderColor = "#e4c28a"}
            />
          </div>

          {/* PASSWORD */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: "rgba(35,30,29,0.3)" }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              style={{
                width: "100%",
                padding: "1rem 1rem 1rem 3rem",
                background: "#fff4e2",
                border: "1px solid #e4c28a",
                borderRadius: "1rem",
                fontSize: "0.875rem",
                fontWeight: "700",
                color: "#231e1d",
                outline: "none",
                transition: "all 0.3s"
              }}
              onFocus={e => e.target.style.borderColor = "#b5854b"}
              onBlur={e => e.target.style.borderColor = "#e4c28a"}
            />
          </div>

          {/* RECUPERAR */}
          <Link
            href="/recuperar-password"
            className="block text-right text-[10px] font-bold uppercase"
            style={{ color: "rgba(35,30,29,0.5)" }}
          >
            ¿OLVIDASTE TU CLAVE?
          </Link>

          {/* BOTÓN */}
          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 transition-all duration-300"
            style={{
              background: "#231e1d",
              color: "#fff4e2",
              border: "2px solid #231e1d"
            }}
            onMouseEnter={e => {
              if (!loading) {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#b5854b";
                el.style.borderColor = "#b5854b";
                el.style.color = "#231e1d";
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "#231e1d";
              el.style.borderColor = "#231e1d";
              el.style.color = "#fff4e2";
            }}
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={18} /> VERIFICANDO...</>
            ) : (
              <>INGRESAR AL SISTEMA <ArrowRight size={16} /></>
            )}
          </button>

        </form>

        {/* FOOTER */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-[10px] font-bold uppercase"
            style={{ color: "rgba(35,30,29,0.5)" }}
          >
            ← VOLVER A LA PÁGINA PRINCIPAL
          </Link>
        </div>

      </div>
    </div>
  );
}
