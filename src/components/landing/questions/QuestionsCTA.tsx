"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useRef, useState, useEffect } from "react";

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  // Durante SSR y antes del mount, siempre retornamos visible:true
  // para que el HTML del servidor coincida con el cliente inicial
  return { ref, visible: !mounted ? true : visible };
}

const QuestionsCTA = () => {
  const card = useScrollReveal(0.2);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -6, y: dx * 6 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  // El transform de entrada 3D solo se aplica post-mount para evitar mismatch
  const cardTransform = !mounted
    ? "perspective(1200px)"
    : card.visible
      ? `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0px)`
      : "perspective(1200px) rotateX(8deg) translateY(40px)";

  return (
    <section
      style={{
        background: "#0a0806",
        padding: "6rem 2rem 8rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(196,163,90,0.07) 0%, transparent 70%)",
      }} />

      {/* Grid texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.03,
        backgroundImage: "linear-gradient(rgba(196,163,90,1) 1px, transparent 1px), linear-gradient(90deg, rgba(196,163,90,1) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div style={{ maxWidth: "860px", margin: "0 auto", perspective: "1200px" }}>
        <div
          ref={(node) => {
            (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            (card.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            position: "relative",
            borderRadius: "2.5rem",
            padding: "5rem 4rem",
            textAlign: "center",
            cursor: "default",
            transformStyle: "preserve-3d",
            transform: cardTransform,
            opacity: !mounted ? 1 : card.visible ? 1 : 0,
            transition: hovered
              ? "transform 0.1s ease"
              : "transform 0.7s cubic-bezier(0.23,1,0.32,1), opacity 0.9s ease",
            background: "linear-gradient(135deg, rgba(30,23,14,0.95) 0%, rgba(18,14,9,0.98) 60%, rgba(26,20,12,0.95) 100%)",
            border: "1px solid rgba(196,163,90,0.2)",
            boxShadow: hovered
              ? "0 40px 100px -20px rgba(0,0,0,0.8), 0 0 60px rgba(196,163,90,0.08), inset 0 1px 0 rgba(196,163,90,0.15)"
              : "0 20px 60px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(196,163,90,0.1)",
          }}
        >
          {/* Light sheen */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "2.5rem", pointerEvents: "none",
            background: mounted
              ? `radial-gradient(ellipse 60% 40% at ${50 + tilt.y * 3}% ${30 - tilt.x * 3}%, rgba(196,163,90,0.06) 0%, transparent 65%)`
              : "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(196,163,90,0.06) 0%, transparent 65%)",
            transition: hovered ? "background 0.1s" : "background 0.6s",
          }} />

          {/* Corner decorations */}
          <div style={{
            position: "absolute", top: "2rem", left: "2rem", width: "40px", height: "40px",
            borderTop: "1px solid rgba(196,163,90,0.35)", borderLeft: "1px solid rgba(196,163,90,0.35)",
            borderRadius: "6px 0 0 0", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "2rem", right: "2rem", width: "40px", height: "40px",
            borderBottom: "1px solid rgba(196,163,90,0.35)", borderRight: "1px solid rgba(196,163,90,0.35)",
            borderRadius: "0 0 6px 0", pointerEvents: "none",
          }} />

          {/* Floating dots — only rendered client-side to avoid hydration mismatch */}
          {mounted && [
            { top: "15%", left: "8%", size: 5, delay: "0s" },
            { top: "75%", left: "5%", size: 3, delay: "0.4s" },
            { top: "20%", right: "7%", size: 4, delay: "0.2s" },
            { top: "65%", right: "10%", size: 6, delay: "0.6s" },
          ].map((dot, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: dot.top,
                left: (dot as any).left,
                right: (dot as any).right,
                width: dot.size,
                height: dot.size,
                borderRadius: "50%",
                background: "rgba(196,163,90,0.4)",
                animation: `pulse3d 3s ease-in-out ${dot.delay} infinite`,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Icon badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "56px", height: "56px", borderRadius: "16px", marginBottom: "2rem",
            background: "rgba(196,163,90,0.08)",
            border: "1px solid rgba(196,163,90,0.25)",
          }}>
            <MessageCircle size={24} style={{ color: "#c4a35a" }} />
          </div>

          {/* Badge label */}
          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{
              display: "inline-block", padding: "5px 16px", borderRadius: "100px",
              background: "rgba(196,163,90,0.08)", border: "1px solid rgba(196,163,90,0.25)",
              color: "#c4a35a", fontSize: "10px", fontWeight: 900,
              letterSpacing: "0.3em", textTransform: "uppercase",
            }}>
              Atención Personalizada
            </span>
          </div>

          {/* Heading */}
          <h2 style={{
            fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 900, fontStyle: "italic",
            lineHeight: 1.05, color: "#fdf9f3", margin: "0 0 1.5rem",
          }}>
            ¿Necesitas ayuda
            <br />
            <span style={{ color: "#c4a35a" }}>estratégica?</span>
          </h2>

          {/* Divider */}
          <div style={{
            width: "50px", height: "2px",
            background: "linear-gradient(90deg, transparent, #c4a35a, transparent)",
            margin: "0 auto 2rem",
          }} />

          {/* Subtext */}
          <p style={{
            maxWidth: "480px", margin: "0 auto 3rem",
            fontSize: "1.05rem", lineHeight: 1.8,
            color: "rgba(253,249,243,0.55)",
          }}>
            Nuestro equipo está listo para ayudarte
            con tu próxima producción premium.
          </p>

          {/* CTA Button */}
          <Link
            href="https://wa.me/51908801912"
            target="_blank"
            style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              padding: "1.1rem 2.4rem", borderRadius: "1rem",
              background: "#c4a35a", color: "#0f0d0b",
              fontWeight: 900, fontSize: "0.8rem", letterSpacing: "0.15em",
              textTransform: "uppercase", textDecoration: "none",
              boxShadow: "0 8px 24px rgba(196,163,90,0.25), 0 2px 8px rgba(0,0,0,0.3)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#d4b472";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(196,163,90,0.4), 0 4px 12px rgba(0,0,0,0.4)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#c4a35a";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(196,163,90,0.25), 0 2px 8px rgba(0,0,0,0.3)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Hablar con asesor
            <ArrowRight size={16} />
          </Link>

          {/* Footer detail */}
          <p style={{
            marginTop: "2rem", fontSize: "0.78rem", letterSpacing: "0.15em",
            color: "rgba(196,163,90,0.35)", textTransform: "uppercase",
          }}>
            Respuesta en menos de 24h
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse3d {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.4); }
        }
      `}</style>
    </section>
  );
};

export default QuestionsCTA;