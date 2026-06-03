"use client";

import { useState, useRef, useEffect } from 'react';
import GoldenThreadBackground from "@/components/auth/GoldenThreadBackground";
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2, Mail, Lock, User,
  ArrowRight, Loader2, CheckCircle2, AlertCircle,
  Phone, MapPin, Eye, EyeOff, Briefcase, Tag, ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Banderas usando flagcdn.com — imágenes reales, funcionan en todos los navegadores/SO
const SOUTH_AMERICA_PREFIXES = [
  { code: 'AR', name: 'Argentina', prefix: '+54', minLen: 10, maxLen: 11 },
  { code: 'BO', name: 'Bolivia', prefix: '+591', minLen: 8, maxLen: 8 },
  { code: 'BR', name: 'Brasil', prefix: '+55', minLen: 10, maxLen: 11 },
  { code: 'CL', name: 'Chile', prefix: '+56', minLen: 9, maxLen: 9 },
  { code: 'CO', name: 'Colombia', prefix: '+57', minLen: 10, maxLen: 10 },
  { code: 'EC', name: 'Ecuador', prefix: '+593', minLen: 9, maxLen: 9 },
  { code: 'GY', name: 'Guyana', prefix: '+592', minLen: 7, maxLen: 7 },
  { code: 'PY', name: 'Paraguay', prefix: '+595', minLen: 9, maxLen: 9 },
  { code: 'PE', name: 'Perú', prefix: '+51', minLen: 9, maxLen: 9 },
  { code: 'SR', name: 'Surinam', prefix: '+597', minLen: 6, maxLen: 7 },
  { code: 'UY', name: 'Uruguay', prefix: '+598', minLen: 8, maxLen: 9 },
  { code: 'VE', name: 'Venezuela', prefix: '+58', minLen: 10, maxLen: 10 },
]

// URL de bandera por código de país (flagcdn = CDN gratuito, sin API key)
const flagUrl = (code: string) =>
  `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;

function Flag({ code, size = 24 }: { code: string; size?: number }) {
  return (
    <img
      src={flagUrl(code)}
      alt={code}
      width={size}
      height={Math.round(size * 0.75)}
      style={{ borderRadius: '2px', objectFit: 'cover', flexShrink: 0 }}
    />
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPrefix, setSelectedPrefix] = useState(SOUTH_AMERICA_PREFIXES[8]); // Perú
  const [showPrefixDropdown, setShowPrefixDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowPrefixDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const ruc = formData.get('ruc') as string;
    const telefonoNum = formData.get('telefono') as string;
    const { minLen, maxLen } = selectedPrefix;

    if (ruc.length !== 11) {
      setError('El RUC debe tener exactamente 11 dígitos');
      setLoading(false);
      return;
    }

    if (telefonoNum.length < minLen || telefonoNum.length > maxLen) {
      setError(
        `El número para ${selectedPrefix.name} debe tener ${minLen === maxLen ? `${minLen}` : `${minLen}–${maxLen}`
        } dígitos`
      );
      setLoading(false);
      return;
    }

    const password = formData.get('password') as string;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setError('La contraseña debe incluir mayúsculas, minúsculas, números y signos');
      setLoading(false);
      return;
    }

    const payload = {
      email: formData.get('email') as string,
      password,
      ruc,
      razon_social: formData.get('razonSocial') as string,
      nombre_comercial: formData.get('nombreComercial') as string,
      telefono: `${selectedPrefix.prefix}${telefonoNum}`,
      direccion: formData.get('direccion') as string,
      tipo_cliente: formData.get('tipoCliente') as string,
    };

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el registro');
      setSuccess(true);
      router.push('/login-cliente');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Error al procesar el registro');
    } finally {
      setLoading(false);
    }
  };

  /* ─── SUCCESS ─── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative" style={{ background: '#fdf9f3' }}>
        <GoldenThreadBackground />
        <div
          className="max-w-md w-full text-center space-y-6 p-10 rounded-[2.5rem]"
          style={{ background: '#fdf9f3', border: '1.5px solid #e8d5a8', boxShadow: '0 20px 60px rgba(26,20,16,0.10)' }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#f5efe4', border: '2px solid #e8d5a8', color: '#8a6d3b' }}
          >
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black" style={{ color: '#1a1410' }}>¡Registro Exitoso!</h2>
          <p className="text-sm" style={{ color: 'rgba(26,20,16,0.60)' }}>
            Su cuenta ha sido creada. Ya puede iniciar sesión.
          </p>
          <Link
            href="/login-cliente"
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
            style={{ background: '#1a1410', color: '#fdf9f3', border: '1.5px solid #1a1410' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#c4a35a'; el.style.borderColor = '#c4a35a'; el.style.color = '#1a1410'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#1a1410'; el.style.borderColor = '#1a1410'; el.style.color = '#fdf9f3'; }}
          >
            Iniciar Sesión <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  /* ─── MAIN FORM ─── */
  return (
    <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center" style={{ background: '#fdf9f3' }}>
      <GoldenThreadBackground />

      <div
        className="relative z-10 w-full grid grid-cols-5 rounded-[2.5rem] overflow-hidden"
        style={{ maxWidth: '900px', border: '1.5px solid #e8d5a8', boxShadow: '0 20px 60px rgba(26,20,16,0.10)' }}
      >

        {/* ── LADO IZQUIERDO ── */}
        <div className="md:flex md:col-span-2 p-10 flex-col justify-between hidden" style={{ background: '#1a1410' }}>
          <div>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-8 shadow-xl" style={{ background: '#fdf9f3' }}>
              <Image src="/logo.png" alt="Logo Guor" width={40} height={40} />
            </div>
            <h2 className="text-3xl italic" style={{ color: '#fdf9f3' }}>
              Excelencia en <br />
              <span className="font-black uppercase text-4xl not-italic" style={{ color: '#c4a35a' }}>
                Textiles B2B
              </span>
            </h2>
            <p
              className="mt-8 text-sm leading-relaxed font-medium pl-4"
              style={{ color: 'rgba(253,249,243,0.65)', borderLeft: '2px solid #c4a35a' }}
            >
              Únete a nuestra red mayorista para gestionar pedidos con soporte
              inteligente y optimizar tus procesos comerciales dentro del
              ecosistema GUOR.
            </p>
          </div>
          <p className="text-[9px] uppercase" style={{ color: 'rgba(253,249,243,0.28)' }}>© 2026 GUOR</p>
        </div>

        {/* ── FORMULARIO ── */}
        <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center" style={{ background: '#fdf9f3' }}>
          <div className="mb-8">
            <h1 className="text-3xl font-black" style={{ color: '#1a1410' }}>Registro de Socio</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: '#8a6d3b' }}>
              Acceso inmediato al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div
                className="p-4 text-[10px] font-black rounded-xl flex items-center gap-3"
                style={{ background: '#fdf9f3', border: '1px solid #8a6d3b', color: '#8a6d3b' }}
              >
                <AlertCircle size={16} /> {error.toUpperCase()}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="md:col-span-2 relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'rgba(26,20,16,0.30)' }} />
                <input name="razonSocial" required placeholder="RAZÓN SOCIAL / EMPRESA" className="register-input" />
              </div>

              <div className="md:col-span-2 relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'rgba(26,20,16,0.30)' }} />
                <input name="nombreComercial" placeholder="NOMBRE COMERCIAL (OPCIONAL)" className="register-input" />
              </div>

              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'rgba(26,20,16,0.30)' }} />
                <input
                  name="ruc" required placeholder="RUC (11 DÍGITOS)" className="register-input"
                  maxLength={11}
                  onInput={e => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ''); }}
                />
              </div>

              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'rgba(26,20,16,0.30)' }} />
                <select name="tipoCliente" required className="register-input appearance-none">
                  <option value="">TIPO DE CLIENTE</option>
                  <option value="corporativo">CORPORATIVO</option>
                  <option value="minorista">MINORISTA</option>
                  <option value="distribuidor">DISTRIBUIDOR</option>
                </select>
              </div>

              {/* ── TELÉFONO CON PREFIJO + BANDERA ── */}
              <div className="md:col-span-2" ref={dropdownRef} style={{ position: 'relative' }}>
                <div
                  className="flex rounded-[1.25rem]"
                  style={{ border: '1.5px solid #e8d5a8', background: '#fdf9f3', overflow: 'visible' }}
                >
                  {/* Botón selector */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setShowPrefixDropdown(v => !v)}
                      className="flex items-center gap-2 px-4 py-4 font-bold text-xs h-full rounded-l-[1.2rem] transition-colors"
                      style={{
                        background: showPrefixDropdown ? '#f5efe4' : 'transparent',
                        color: '#1a1410',
                        borderRight: '1.5px solid #e8d5a8',
                        minWidth: '110px',
                      }}
                    >
                      {/* Imagen real de bandera */}
                      <Flag code={selectedPrefix.code} size={22} />
                      <span style={{ color: '#8a6d3b', fontWeight: 900, fontSize: '0.75rem' }}>
                        {selectedPrefix.prefix}
                      </span>
                      <ChevronDown
                        size={13}
                        style={{
                          color: 'rgba(26,20,16,0.40)',
                          transform: showPrefixDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: '0.2s',
                        }}
                      />
                    </button>

                    {/* ── DROPDOWN ── */}
                    {showPrefixDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 6px)',
                          left: 0,
                          zIndex: 9999,
                          background: '#fdf9f3',
                          border: '1.5px solid #e8d5a8',
                          borderRadius: '1rem',
                          boxShadow: '0 8px 32px rgba(26,20,16,0.13)',
                          minWidth: '220px',
                          maxHeight: '264px',
                          overflowY: 'auto',
                        }}
                      >
                        {SOUTH_AMERICA_PREFIXES.map(country => {
                          const isSelected = selectedPrefix.code === country.code;
                          return (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => { setSelectedPrefix(country); setShowPrefixDropdown(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold transition-colors"
                              style={{
                                background: isSelected ? '#f5efe4' : 'transparent',
                                color: '#1a1410',
                              }}
                              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#f5efe4'; }}
                              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                              {/* Bandera real */}
                              <Flag code={country.code} size={22} />
                              <span style={{ flex: 1 }}>{country.name}</span>
                              <span style={{ color: '#8a6d3b', fontWeight: 900 }}>{country.prefix}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Input número */}
                  <div className="relative flex-1">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      size={16}
                      style={{ color: 'rgba(26,20,16,0.28)' }}
                    />
                    <input
                      name="telefono"
                      required
                      placeholder="NÚMERO DE TELÉFONO"
                      className="w-full pl-10 pr-4 py-4 text-xs font-bold outline-none rounded-r-[1.2rem]"
                      style={{ background: 'transparent', color: '#1a1410', border: 'none' }}
                      maxLength={selectedPrefix.maxLen}
                      onInput={e => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ''); }}
                    />
                  </div>
                </div>
              </div>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'rgba(26,20,16,0.30)' }} />
                <input name="direccion" required placeholder="DIRECCIÓN FISCAL" className="register-input" />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'rgba(26,20,16,0.30)' }} />
                <input name="email" type="email" required placeholder="CORREO CORPORATIVO" className="register-input" />
              </div>

              <div className="md:col-span-2 relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'rgba(26,20,16,0.30)' }} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="CONTRASEÑA (A-a, 0-9, #$*)"
                  className="register-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(26,20,16,0.30)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2"
              style={{ background: '#1a1410', color: '#fdf9f3', border: '1.5px solid #1a1410' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#c4a35a'; el.style.borderColor = '#c4a35a'; el.style.color = '#1a1410'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#1a1410'; el.style.borderColor = '#1a1410'; el.style.color = '#fdf9f3'; }}
            >
              {loading ? <><Loader2 className="animate-spin" size={16} /> Procesando...</> : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-8 text-center pt-6" style={{ borderTop: '1px solid #e8d5a8' }}>
            <p className="text-[10px] uppercase" style={{ color: 'rgba(26,20,16,0.45)' }}>
              ¿Ya tiene una cuenta?{' '}
              <Link href="/login-cliente" className="font-bold" style={{ color: '#8a6d3b' }}>
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
          background-color: #fdf9f3;
          border: 1.5px solid #e8d5a8;
          border-radius: 1.25rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #1a1410;
          outline: none;
          transition: all 0.25s ease;
        }
        .register-input:focus {
          border-color: #c4a35a;
          box-shadow: 0 4px 16px rgba(196,163,90,0.14);
        }
        .register-input::placeholder {
          color: rgba(26,20,16,0.32);
        }
        .register-input option {
          background: #fdf9f3;
          color: #1a1410;
        }
      `}</style>
    </div>
  );
}