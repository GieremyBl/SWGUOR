"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function useScrollReveal(threshold = 0.15) {
  const textRef = useRef<HTMLDivElement>(null);
  const [textVisible, setTextVisible] = useState(false);
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTextVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref: textRef, visible: textVisible };
}

const CollectionsCTA = () => {
  const { ref, visible } = useScrollReveal();

  return (
    <section style={{ background: "#0a0806", padding: "4rem 2rem 8rem" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          ref={ref}
          style={{
            borderRadius: "40px", padding: "6rem 4rem", textAlign: "center",
            background: "linear-gradient(135deg,#1a1410 0%,#2a1e10 50%,#1a1410 100%)",
            border: "1px solid rgba(196,163,90,0.2)",
            position: "relative", overflow: "hidden",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
            transition: "all 0.9s ease",
            boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* Radial glow */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: "500px", height: "500px", borderRadius: "50%",
            background: "radial-gradient(circle,rgba(196,163,90,0.08) 0%,transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{
              display: "inline-block", padding: "6px 18px", borderRadius: "100px",
              background: "rgba(196,163,90,0.1)", border: "1px solid rgba(196,163,90,0.35)",
              color: "#c4a35a", fontSize: "10px", fontWeight: 900,
              letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "2rem",
            }}>
              Nueva Colección
            </span>

            <h2 style={{
              fontSize: "clamp(2.2rem, 5vw, 4rem)", fontWeight: 900,
              fontStyle: "italic", lineHeight: 1.05,
              color: "#fdf9f3", marginBottom: "1.5rem",
            }}>
              Inicia tu próxima
              <br />
              <span style={{ color: "#c4a35a" }}>colección con GUOR.</span>
            </h2>

            <div style={{ width: "50px", height: "2px", background: "#c4a35a", margin: "0 auto 1.5rem" }} />

            <p style={{
              fontSize: "1.05rem", lineHeight: 1.8,
              color: "rgba(253,249,243,0.55)",
              maxWidth: "520px", margin: "0 auto 3rem",
            }}>
              Creamos prendas premium enfocadas en moda moderna,
              calidad estratégica y producción eficiente.
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
              Explorar Alianza <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollectionsCTA;