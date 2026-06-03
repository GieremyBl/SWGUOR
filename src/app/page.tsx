"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Testimonials from "@/components/landing/Testimonials";
import { ArrowRight, Star, Shield, Truck, ChevronDown, TrendingUp, Users } from "lucide-react";

/* ─────────────────────────────────────────────
    HOOK: Intersection Observer for scroll reveals
───────────────────────────────────────────── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─────────────────────────────────────────────
    ANIMATED COUNTER
───────────────────────────────────────────── */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useScrollReveal(0.5);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = end / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [visible, end]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─────────────────────────────────────────────
    3D TILT CARD (Optimizado con will-change)
───────────────────────────────────────────── */
function TiltCard({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale3d(1.02,1.02,1.02)`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "perspective(800px) rotateY(0) rotateX(0) scale3d(1,1,1)";
  };
  return (
    <div
      ref={cardRef}
      className={className}
      style={{ transition: "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)", willChange: "transform", ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
    FLOATING ORBS BACKGROUND
───────────────────────────────────────────── */
function FloatingOrbs() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

/* ═══════════════════════════════════════════
    LANDING PAGE
═══════════════════════════════════════════ */
export default function LandingPage() {
  const benefits1 = useScrollReveal();
  const products1 = useScrollReveal();
  const stats1 = useScrollReveal();

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: "#0f0d0b", color: "#fdf9f3" }}>
      <Navbar />

      {/* ══════════ HERO ══════════ */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          background: "linear-gradient(135deg, #0f0d0b 0%, #1a1410 50%, #0f0d0b 100%)",
        }}
      >
        <FloatingOrbs />

        {/* Grid texture overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0, opacity: 0.04,
          backgroundImage: "linear-gradient(#c4a35a 1px, transparent 1px), linear-gradient(90deg, #c4a35a 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* PARALLAX OPTIMIZADO: Corregido usando CSS puro mediante background-attachment sin JS listeners */}
        <div style={{
          position: "absolute", right: 0, top: 0, width: "50%", height: "100%", zIndex: 1,
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, #0f0d0b 0%, transparent 40%, transparent 80%, #0f0d0b 100%)",
            zIndex: 2,
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(0deg, #0f0d0b 0%, transparent 30%)",
            zIndex: 2,
          }} />

          {/* CRÍTICO PARA EL LCP: Añadidos 'sizes' exactos para que no descargue la versión de pantalla completa */}
          <Image
            src="/fotohome.jpg"
            alt="GUOR Moda Femenina"
            fill
            className="object-cover object-center"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            style={{ opacity: 0.45, willChange: "transform" }}
          />
        </div>

        {/* HERO CONTENT */}
        <div style={{ position: "relative", zIndex: 10, maxWidth: "1200px", margin: "0 auto", padding: "8rem 2rem 6rem", width: "100%" }}>

          {/* Badge */}
          <div className="hero-badge-anim" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "2rem" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 18px", borderRadius: "100px",
              border: "1px solid rgba(196,163,90,0.4)",
              background: "rgba(196,163,90,0.08)",
              color: "#c4a35a", fontSize: "10px", fontWeight: 900,
              letterSpacing: "0.3em", textTransform: "uppercase",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c4a35a", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
              Corporación Textil Peruana · B2B
            </span>
          </div>

          {/* Headline */}
          <h1 className="hero-title-anim" style={{
            fontSize: "clamp(3rem, 7vw, 6rem)",
            fontWeight: 900,
            lineHeight: 1,
            marginBottom: "1.5rem",
            maxWidth: "700px",
          }}>
            <span style={{ display: "block", color: "#fdf9f3" }}>Moda que</span>
            <span style={{ display: "block", color: "#fdf9f3" }}>mueve</span>
            <span style={{ display: "block", fontStyle: "italic", color: "#c4a35a" }}>negocios</span>
          </h1>

          <div style={{ width: "60px", height: "3px", background: "linear-gradient(90deg, #c4a35a, transparent)", marginBottom: "2rem" }} className="hero-line-anim" />

          <p className="hero-text-anim" style={{
            fontSize: "1.1rem", lineHeight: 1.7, maxWidth: "480px",
            color: "rgba(253,249,243,0.65)", marginBottom: "3rem",
          }}>
            Producción textil femenina premium con logística inteligente.
            Alianzas B2B para{" "}
            <span style={{ color: "#fdf9f3", fontWeight: 700 }}>mayoristas, minoristas y distribuidores</span>{" "}
            en toda Latinoamérica.
          </p>

          {/* CTA */}
          <div className="hero-cta-anim" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href="/registro-cliente"
              className="hover:scale-105 transition-all duration-300"
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                padding: "16px 32px", borderRadius: "100px",
                background: "#c4a35a", color: "#0f0d0b",
                fontWeight: 900, fontSize: "13px", letterSpacing: "0.05em",
                textDecoration: "none",
                boxShadow: "0 0 40px rgba(196,163,90,0.3)",
              }}
            >
              Iniciar Alianza B2B <ArrowRight size={16} />
            </Link>

            <Link
              href="/login-cliente"
              className="hover:bg-white/10 hover:border-white/40 transition-all duration-300"
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                padding: "16px 32px", borderRadius: "100px",
                background: "transparent", color: "#fdf9f3",
                fontWeight: 700, fontSize: "13px",
                border: "1px solid rgba(253,249,243,0.2)",
                textDecoration: "none",
              }}
            >
              Portal Socios
            </Link>
          </div>

          {/* Descuento pill */}
          <div className="hero-discount-anim" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            marginTop: "2.5rem", padding: "10px 20px", borderRadius: "12px",
            background: "rgba(196,163,90,0.1)", border: "1px solid rgba(196,163,90,0.25)",
          }}>
            <Star size={14} style={{ color: "#c4a35a", fill: "#c4a35a" }} />
            <span style={{ fontSize: "13px", color: "rgba(253,249,243,0.8)", fontWeight: 600 }}>
              <span style={{ color: "#c4a35a", fontWeight: 900 }}>20% off</span> en tu primera orden corporativa
            </span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
          color: "rgba(253,249,243,0.35)", fontSize: "10px", letterSpacing: "0.2em",
          textTransform: "uppercase", zIndex: 10,
          animation: "float 2s ease-in-out infinite",
        }}>
          <span>Scroll</span>
          <ChevronDown size={16} />
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <div
        ref={stats1.ref}
        style={{
          background: "#c4a35a",
          padding: "3rem 2rem",
        }}
      >
        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0",
        }}>
          {[
            { label: "Años de experiencia", end: 6, suffix: "+" },
            { label: "Clientes B2B activos", end: 200, suffix: "+" },
            { label: "Prendas por colección", end: 500, suffix: "+" },
            { label: "Satisfacción garantizada", end: 100, suffix: "%" },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              textAlign: "center", padding: "1rem 2rem",
              borderRight: i < 3 ? "1px solid rgba(15,13,11,0.2)" : "none",
              opacity: stats1.visible ? 1 : 0,
              transform: stats1.visible ? "translateY(0)" : "translateY(20px)",
              transition: `all 0.6s ease ${i * 0.1}s`,
            }}>
              <p style={{ fontSize: "2.5rem", fontWeight: 900, color: "#0f0d0b", lineHeight: 1, margin: 0 }}>
                <Counter end={stat.end} suffix={stat.suffix} />
              </p>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(15,13,11,0.65)", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ BENEFICIOS ══════════ */}
      <section style={{ background: "#0f0d0b", padding: "8rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* Section label */}
          <div style={{ textAlign: "center", marginBottom: "5rem" }}>
            <span style={{
              display: "inline-block", padding: "4px 16px", borderRadius: "100px",
              background: "rgba(196,163,90,0.1)", border: "1px solid rgba(196,163,90,0.3)",
              color: "#c4a35a", fontSize: "10px", fontWeight: 900,
              letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "1.5rem",
            }}>
              Por qué elegirnos
            </span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 900, color: "#fdf9f3", margin: 0 }}>
              La ventaja{" "}
              <span style={{ color: "#c4a35a", fontStyle: "italic" }}>GUOR</span>
            </h2>
          </div>

          <div
            ref={benefits1.ref}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}
          >
            {[
              {
                icon: Shield,
                title: "Calidad Premium Garantizada",
                desc: "Control de calidad en cada etapa de producción. Materiales seleccionados que cumplen estándares internacionales de moda femenina.",
                accent: "#c4a35a",
              },
              {
                icon: Truck,
                title: "Logística Inteligente",
                desc: "Entrega puntual con seguimiento en tiempo real. Cobertura nacional e internacional para que tu negocio nunca se detenga.",
                accent: "#c4a35a",
              },
              {
                icon: TrendingUp,
                title: "Soporte Estratégico B2B",
                desc: "Asesoría personalizada, precios mayoristas competitivos y condiciones flexibles adaptadas al volumen de tu empresa.",
                accent: "#c4a35a",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <TiltCard
                  key={item.title}
                  style={{
                    padding: "2.5rem",
                    borderRadius: "24px",
                    border: "1px solid rgba(196,163,90,0.15)",
                    background: "rgba(255,255,255,0.02)",
                    cursor: "default",
                    opacity: benefits1.visible ? 1 : 0,
                    transform: benefits1.visible ? "translateY(0)" : "translateY(40px)",
                    transition: `all 0.7s ease ${i * 0.15}s`,
                  }}
                >
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "16px",
                    background: "rgba(196,163,90,0.12)", border: "1px solid rgba(196,163,90,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "1.75rem",
                  }}>
                    <Icon size={22} style={{ color: "#c4a35a" }} />
                  </div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "#fdf9f3", marginBottom: "0.75rem" }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "rgba(253,249,243,0.5)", margin: 0 }}>
                    {item.desc}
                  </p>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ PRENDAS DESTACADAS (Optimizado con Clases de CSS) ══════════ */}
      <section style={{ background: "#111009", padding: "8rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "4rem", flexWrap: "wrap", gap: "1rem" }}>
            <div ref={products1.ref}>
              <span style={{
                display: "inline-block", padding: "4px 16px", borderRadius: "100px",
                background: "rgba(196,163,90,0.1)", border: "1px solid rgba(196,163,90,0.3)",
                color: "#c4a35a", fontSize: "10px", fontWeight: 900,
                letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "1rem",
              }}>
                Colección 2026
              </span>
              <h2 style={{
                fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#fdf9f3",
                margin: 0,
                opacity: products1.visible ? 1 : 0,
                transform: products1.visible ? "translateX(0)" : "translateX(-30px)",
                transition: "all 0.7s ease",
              }}>
                Prendas <span style={{ color: "#c4a35a", fontStyle: "italic" }}>destacadas</span>
              </h2>
            </div>
            <Link
              href="/colecciones"
              className="hover:pl-2 transition-all duration-300"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                color: "#c4a35a", fontWeight: 700, fontSize: "13px",
                textDecoration: "none",
              }}
            >
              Ver todo <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}>
            {[1, 2, 3, 4, 5].map((item, i) => (
              <TiltCard
                key={item}
                className="group" // Agregamos 'group' para controlar el hover de la imagen sin JS
                style={{
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid rgba(196,163,90,0.12)",
                  background: "#1a1410",
                  cursor: "pointer",
                  opacity: products1.visible ? 1 : 0,
                  transform: products1.visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.97)",
                  transition: `all 0.7s ease ${i * 0.1}s`,
                }}
              >
                <div style={{ position: "relative", height: "260px", overflow: "hidden" }}>
                  {/* OPTIMIZACIÓN: Transición controlada por hardware (GPU) usando Tailwind nativo */}
                  <Image
                    src={`/conjunto${item}.png`}
                    alt={`Prenda ${item}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(15,13,11,0.8) 0%, transparent 60%)",
                  }} />
                  <span style={{
                    position: "absolute", top: "12px", right: "12px",
                    padding: "4px 12px", borderRadius: "100px",
                    background: "rgba(196,163,90,0.9)", color: "#0f0d0b",
                    fontSize: "9px", fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
                  }}>
                    Nuevo
                  </span>
                </div>
                <div style={{ padding: "1.25rem" }}>
                  <h3 style={{ fontWeight: 900, fontSize: "0.95rem", color: "#fdf9f3", margin: "0 0 4px" }}>
                    Prenda {item}
                  </h3>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#c4a35a", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Colección 2026
                  </p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section style={{
        background: "linear-gradient(135deg, #1a1410 0%, #2a1e10 50%, #1a1410 100%)",
        padding: "8rem 2rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative lines */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.05,
          backgroundImage: "radial-gradient(circle at 20% 50%, #c4a35a 1px, transparent 1px), radial-gradient(circle at 80% 50%, #c4a35a 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,163,90,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 18px", borderRadius: "100px",
            border: "1px solid rgba(196,163,90,0.4)",
            background: "rgba(196,163,90,0.08)",
            color: "#c4a35a", fontSize: "10px", fontWeight: 900,
            letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "2rem",
          }}>
            <Users size={12} /> Beneficio exclusivo B2B
          </span>

          <h2 style={{
            fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 900,
            color: "#fdf9f3", lineHeight: 1.05, marginBottom: "1.5rem",
          }}>
            ¡Bienvenido a la{" "}
            <span style={{ color: "#c4a35a", fontStyle: "italic" }}>Familia!</span>
          </h2>

          <p style={{ fontSize: "1.1rem", color: "rgba(253,249,243,0.6)", maxWidth: "520px", margin: "0 auto 3rem", lineHeight: 1.7 }}>
            Regístrate hoy como socio estratégico y obtén un{" "}
            <span style={{ color: "#c4a35a", fontWeight: 900 }}>20% de descuento</span>{" "}
            en tu primera orden. Logística inteligente, soporte prioritario y precios exclusivos.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/registro-cliente"
              className="hover:scale-105 transition-all duration-300"
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                padding: "18px 40px", borderRadius: "100px",
                background: "#c4a35a", color: "#0f0d0b",
                fontWeight: 900, fontSize: "13px", letterSpacing: "0.05em",
                textDecoration: "none",
                boxShadow: "0 0 40px rgba(196,163,90,0.3)",
              }}
            >
              Crear Cuenta Gratis <ArrowRight size={16} />
            </Link>
            <Link
              href="/login-cliente"
              className="hover:bg-white/10 hover:border-white/40 transition-all duration-300"
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                padding: "18px 40px", borderRadius: "100px",
                background: "transparent", color: "#fdf9f3",
                fontWeight: 700, fontSize: "13px",
                border: "1px solid rgba(253,249,243,0.2)",
                textDecoration: "none",
              }}
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIOS ══════════ */}
      <div style={{ background: "#0f0d0b" }}>
        <Testimonials />
      </div>

      <Footer />

      {/* ══════════ GLOBAL STYLES (Optimizados sin @import bloqueante) ══════════ */}
      <style jsx global>{`
        body {
          font-family: var(--font-dm-sans), sans-serif;
        }

        h1, h2, h3 {
          font-family: var(--font-playfair), serif;
        }

        /* ── Orbs ── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .orb-1 {
          width: 500px; height: 500px;
          top: -100px; right: 10%;
          background: rgba(196,163,90,0.07);
          animation: orbFloat1 12s ease-in-out infinite;
        }
        .orb-2 {
          width: 350px; height: 350px;
          bottom: 10%; left: 5%;
          background: rgba(196,163,90,0.05);
          animation: orbFloat2 15s ease-in-out infinite;
        }
        .orb-3 {
          width: 250px; height: 250px;
          top: 40%; left: 40%;
          background: rgba(196,163,90,0.04);
          animation: orbFloat1 20s ease-in-out infinite reverse;
        }

        /* ── Hero animations ── */
        .hero-badge-anim {
          opacity: 0;
          transform: translateY(20px);
          animation: revealUp 0.8s ease 0.2s forwards;
        }
        .hero-title-anim {
          opacity: 0;
          transform: translateY(30px);
          animation: revealUp 0.9s ease 0.4s forwards;
        }
        .hero-line-anim {
          opacity: 0;
          transform: scaleX(0);
          transform-origin: left;
          animation: revealLine 0.8s ease 0.6s forwards;
        }
        .hero-text-anim {
          opacity: 0;
          transform: translateY(20px);
          animation: revealUp 0.8s ease 0.7s forwards;
        }
        .hero-cta-anim {
          opacity: 0;
          transform: translateY(20px);
          animation: revealUp 0.8s ease 0.9s forwards;
        }
        .hero-discount-anim {
          opacity: 0;
          animation: revealUp 0.8s ease 1.1s forwards;
        }

        @keyframes revealUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes revealLine {
          to { opacity: 1; transform: scaleX(1); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.05); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 30px) scale(1.08); }
        }
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}