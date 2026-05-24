"use client";

import { useState, useRef } from 'react';
import {
  Mail, ArrowLeft, Loader2, SendHorizontal,
  CheckCircle2, Lock, Eye, EyeOff, KeyRound, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import GoldenThreadBackground from "@/components/auth/GoldenThreadBackground";
import Image from 'next/image';

type Step = 'email' | 'otp' | 'password' | 'success';

const STEP_INDEX: Record<Step, number> = { email: 0, otp: 1, password: 2, success: 3 };
const STEP_LABELS = ['Correo', 'Código', 'Contraseña'];

const slideVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export default function RecoverPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── helpers ── */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo enviar el código');
      setStep('otp');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp]; next[index] = value; setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus(); }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { setError('Ingresa el código completo de 6 dígitos'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Código incorrecto o expirado');
      setAccessToken(data.access_token);
      setStep('password');
    } catch (err: any) {
      setError(err.message);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null);
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;
    const hasUpper = /[A-Z]/.test(password), hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password), hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setError('La contraseña debe incluir mayúsculas, minúsculas, números y signos'); return;
    }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al restablecer la contraseña');
      setStep('success');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  /* ── ÉXITO ── */
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative" style={{ background: '#fdf9f3' }}>
        <GoldenThreadBackground />
        <div
          className="relative z-10 max-w-md w-full text-center space-y-6 p-10 rounded-[2.5rem]"
          style={{ background: '#fdf9f3', border: '1.5px solid #e8d5a8', boxShadow: '0 20px 60px rgba(26,20,16,0.10)' }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#f5efe4', border: '2px solid #e8d5a8', color: '#8a6d3b' }}
          >
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black" style={{ color: '#1a1410' }}>¡Contraseña Actualizada!</h2>
          <p className="text-sm" style={{ color: 'rgba(26,20,16,0.60)' }}>
            Tu contraseña ha sido restablecida exitosamente.
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

  /* ── MAIN ── */
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#fdf9f3' }}>
      <GoldenThreadBackground />

      <div
        className="relative z-10 max-w-4xl w-full rounded-[3rem] overflow-hidden grid grid-cols-1 md:grid-cols-5"
        style={{ border: '1.5px solid #e8d5a8', boxShadow: '0 20px 60px rgba(26,20,16,0.10)' }}
      >

        {/* ── PANEL IZQUIERDO ── */}
        <div className="hidden md:flex md:col-span-2 p-10 flex-col justify-between" style={{ background: '#1a1410' }}>
          <div>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-8 shadow-xl" style={{ background: '#fdf9f3' }}>
              <Image src="/logo.png" alt="Logo Guor" width={40} height={40} />
            </div>
            <h2 className="text-3xl italic" style={{ color: '#fdf9f3' }}>
              Recupera tu <br />
              <span className="font-black uppercase text-4xl not-italic" style={{ color: '#c4a35a' }}>
                Acceso
              </span>
            </h2>
            <p
              className="mt-8 text-sm leading-relaxed font-medium pl-4"
              style={{ color: 'rgba(253,249,243,0.65)', borderLeft: '2px solid #c4a35a' }}
            >
              Te enviaremos un código de verificación a tu correo para que puedas
              restablecer tu contraseña de forma segura.
            </p>

            {/* Indicador de pasos */}
            <div className="mt-10 space-y-3">
              {STEP_LABELS.map((label, i) => {
                const current = STEP_INDEX[step];
                const done = current > i;
                const active = current === i;
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-all duration-300"
                      style={{
                        background: done ? '#c4a35a' : active ? '#fdf9f3' : 'rgba(253,249,243,0.12)',
                        color: done ? '#1a1410' : active ? '#1a1410' : 'rgba(253,249,243,0.35)',
                      }}
                    >
                      {done ? '✓' : i + 1}
                    </div>
                    <span
                      className="text-xs font-bold uppercase tracking-widest transition-all duration-300"
                      style={{ color: done || active ? '#fdf9f3' : 'rgba(253,249,243,0.30)' }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[9px] uppercase" style={{ color: 'rgba(253,249,243,0.28)' }}>© 2026 GUOR</p>
        </div>

        {/* ── PANEL DERECHO (FORMULARIO) ── */}
        <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center" style={{ background: '#fdf9f3', minHeight: '520px' }}>

          <AnimatePresence mode="wait">

            {/* PASO 1: CORREO */}
            {step === 'email' && (
              <motion.div key="email" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
                <div className="mb-8">
                  <Link
                    href="/login-cliente"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase mb-6 transition-colors"
                    style={{ color: 'rgba(26,20,16,0.35)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#8a6d3b')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(26,20,16,0.35)')}
                  >
                    <ArrowLeft size={13} /> Volver al login
                  </Link>
                  <h1 className="text-3xl font-black" style={{ color: '#1a1410' }}>Recuperar Acceso</h1>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: '#8a6d3b' }}>
                    Te enviamos un código de 6 dígitos
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {error && <ErrorBox message={error} />}

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'rgba(26,20,16,0.30)' }} />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="CORREO CORPORATIVO" required className="recover-input"
                    />
                  </div>

                  <SubmitButton loading={loading} label="Enviar Código" icon={<SendHorizontal size={15} style={{ color: '#c4a35a' }} />} />
                </form>
              </motion.div>
            )}

            {/* PASO 2: OTP */}
            {step === 'otp' && (
              <motion.div key="otp" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
                <div className="mb-8">
                  <button
                    onClick={() => { setStep('email'); setError(null); setOtp(['', '', '', '', '', '']); }}
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase mb-6 transition-colors"
                    style={{ color: 'rgba(26,20,16,0.35)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#8a6d3b')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(26,20,16,0.35)')}
                  >
                    <ArrowLeft size={13} /> Volver
                  </button>
                  <h1 className="text-3xl font-black" style={{ color: '#1a1410' }}>Verificar Código</h1>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: '#8a6d3b' }}>
                    Enviado a{' '}
                    <span style={{ color: '#1a1410' }}>{email}</span>
                  </p>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  {error && <ErrorBox message={error} />}

                  <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={e => handleOtpInput(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className="otp-input"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  <SubmitButton
                    loading={loading}
                    disabled={otp.join('').length !== 6}
                    label="Verificar Código"
                    icon={<KeyRound size={15} style={{ color: '#c4a35a' }} />}
                  />

                  <p className="text-center text-[10px] uppercase font-bold" style={{ color: 'rgba(26,20,16,0.40)' }}>
                    ¿No recibiste el código?{' '}
                    <button
                      type="button"
                      className="font-black transition-colors"
                      style={{ color: '#8a6d3b' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#1a1410')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#8a6d3b')}
                      onClick={() => {
                        setError(null);
                        fetch('/api/auth/send-otp', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email }),
                        });
                      }}
                    >
                      Reenviar
                    </button>
                  </p>
                </form>
              </motion.div>
            )}

            {/* PASO 3: NUEVA CONTRASEÑA */}
            {step === 'password' && (
              <motion.div key="password" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
                <div className="mb-8">
                  <h1 className="text-3xl font-black" style={{ color: '#1a1410' }}>Nueva Contraseña</h1>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1" style={{ color: '#8a6d3b' }}>
                    Crea una contraseña segura
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {error && <ErrorBox message={error} />}

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'rgba(26,20,16,0.30)' }} />
                    <input
                      name="password" type={showPassword ? 'text' : 'password'}
                      required placeholder="NUEVA CONTRASEÑA (A-a, 0-9, #$*)" className="recover-input pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: 'rgba(26,20,16,0.30)' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'rgba(26,20,16,0.30)' }} />
                    <input
                      name="confirm" type={showConfirm ? 'text' : 'password'}
                      required placeholder="CONFIRMAR CONTRASEÑA" className="recover-input pr-12"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: 'rgba(26,20,16,0.30)' }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <SubmitButton loading={loading} label="Restablecer Contraseña" />
                </form>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Footer link */}
          <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid #e8d5a8' }}>
            <p className="text-[10px] uppercase" style={{ color: 'rgba(26,20,16,0.45)' }}>
              ¿Recordaste tu contraseña?{' '}
              <Link href="/login-cliente" className="font-bold" style={{ color: '#8a6d3b' }}>
                Iniciar Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .recover-input {
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
        .recover-input:focus {
          border-color: #c4a35a;
          box-shadow: 0 4px 16px rgba(196,163,90,0.14);
        }
        .recover-input::placeholder {
          color: rgba(26,20,16,0.32);
        }
        .otp-input {
          width: 52px;
          height: 60px;
          text-align: center;
          font-size: 1.4rem;
          font-weight: 900;
          color: #1a1410;
          background: #fdf9f3;
          border: 1.5px solid #e8d5a8;
          border-radius: 1.1rem;
          outline: none;
          transition: all 0.2s ease;
          caret-color: #c4a35a;
        }
        .otp-input:focus {
          border-color: #c4a35a;
          box-shadow: 0 4px 16px rgba(196,163,90,0.18);
          transform: scale(1.06);
        }
      `}</style>
    </div>
  );
}

/* ── Subcomponentes ── */

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="p-4 text-[10px] font-black rounded-xl flex items-center gap-3"
      style={{ background: '#fdf9f3', border: '1px solid #8a6d3b', color: '#8a6d3b' }}
    >
      {message.toUpperCase()}
    </div>
  );
}

function SubmitButton({
  loading, label, icon, disabled,
}: {
  loading: boolean; label: string; icon?: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2"
      style={{ background: '#1a1410', color: '#fdf9f3', border: '1.5px solid #1a1410', opacity: disabled ? 0.45 : 1 }}
      onMouseEnter={e => {
        if (loading || disabled) return;
        const el = e.currentTarget as HTMLElement;
        el.style.background = '#c4a35a'; el.style.borderColor = '#c4a35a'; el.style.color = '#1a1410';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = '#1a1410'; el.style.borderColor = '#1a1410'; el.style.color = '#fdf9f3';
      }}
    >
      {loading
        ? <Loader2 className="animate-spin" size={16} />
        : <>{label}{icon}</>
      }
    </button>
  );
}