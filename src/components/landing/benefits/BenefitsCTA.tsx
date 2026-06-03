"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const BenefitsCTA = () => {
  const sRef = useRef<HTMLDivElement>(null);
  const [sVisible, setSVisible] = useState(false);

  useEffect(() => {
    const el = sRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section style={{ background: "#0f0d0b", padding: "4rem 2rem 8rem" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div
          ref={sRef}
          style={{
            borderRadius: "40px", padding: "5rem 4rem", textAlign: "center",
            background: "linear-gradient(135deg,rgba(196,163,90,0.08) 0%,rgba(196,163,90,0.02) 100%)",
            border: "1px solid rgba(196,163,90,0.25)",
            position: "relative", overflow: "hidden",
            opacity: sVisible ? 1 : 0,
            transform: sVisible ? "translateY(0)" : "translateY(40px)",
            transition: "all 0.9s ease",
          }}
        >
          {/* Radial glow */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: "400px", height: "400px", borderRadius: "50%",
            background: "radial-gradient(circle,rgba(196,163,90,0.07) 0%,transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 18px", borderRadius: "100px",
              background: "rgba(196,163,90,0.1)", border: "1px solid rgba(196,163,90,0.35)",
              color: "#c4a35a", fontSize: "10px", fontWeight: 900,
              letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "2rem",
            }}>
              <Sparkles size={12} /> Alianza Estratégica
            </span>

            <h2 style={{
              fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 900,
              fontStyle: "italic", lineHeight: 1.1,
              color: "#fdf9f3", marginBottom: "1rem",
            }}>
              Más que proveedores,
              <br />
              <span style={{ color: "#c4a35a" }}>somos aliados estratégicos.</span>
            </h2>

            <div style={{ width: "50px", height: "2px", background: "#c4a35a", margin: "0 auto 1.5rem" }} />

            <p style={{
              fontSize: "1rem", lineHeight: 1.8,
              color: "rgba(253,249,243,0.55)",
              maxWidth: "480px", margin: "0 auto 2.5rem",
            }}>
              Accede a beneficios exclusivos, producción premium y atención
              especializada para potenciar tu marca.
            </p>

            <Link
              href="/registro-cliente"
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                padding: "16px 36px", borderRadius: "100px",
                background: "#c4a35a", color: "#0f0d0b",
                fontWeight: 900, fontSize: "13px", letterSpacing: "0.05em",
                textDecoration: "none", transition: "all 0.3s ease",
                boxShadow: "0 0 40px rgba(196,163,90,0.25)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 0 60px rgba(196,163,90,0.45)";
                e.currentTarget.style.background = "#d4b472";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 0 40px rgba(196,163,90,0.25)";
                e.currentTarget.style.background = "#c4a35a";
              }}
            >
              Iniciar Alianza B2B <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsCTA;