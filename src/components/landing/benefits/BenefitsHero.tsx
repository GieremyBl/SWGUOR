"use client";

import { useEffect, useRef, useState } from "react";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const BenefitsHero = () => {
  const s = useScrollReveal();

  return (
    <section style={{
      background: "#0f0d0b", padding: "10rem 2rem 5rem",
      position: "relative", overflow: "hidden", textAlign: "center",
    }}>
      {/* Grid texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.035, pointerEvents: "none",
        backgroundImage: "linear-gradient(#c4a35a 1px,transparent 1px),linear-gradient(90deg,#c4a35a 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      {/* Center glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle,rgba(196,163,90,0.07) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />

      <div ref={s.ref} style={{
        maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1,
        opacity: s.visible ? 1 : 0,
        transform: s.visible ? "translateY(0)" : "translateY(40px)",
        transition: "all 0.9s ease",
      }}>
        <span style={{
          display: "inline-block", padding: "6px 20px", borderRadius: "100px",
          background: "rgba(196,163,90,0.08)", border: "1px solid rgba(196,163,90,0.35)",
          color: "#c4a35a", fontSize: "10px", fontWeight: 900,
          letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: "2rem",
        }}>
          Beneficios
        </span>

        <h1 style={{
          fontSize: "clamp(2.8rem, 6vw, 5rem)", fontWeight: 900,
          fontStyle: "italic", lineHeight: 1, color: "#fdf9f3",
          marginBottom: "1.5rem",
        }}>
          Ventajas diseñadas
          <br />
          <span style={{ color: "#c4a35a" }}>para impulsar tu negocio.</span>
        </h1>

        <div style={{ width: "60px", height: "3px", background: "linear-gradient(90deg,#c4a35a,transparent)", margin: "0 auto 2rem" }} />

        <p style={{
          fontSize: "1.1rem", lineHeight: 1.8,
          color: "rgba(253,249,243,0.55)", margin: 0,
        }}>
          En GUOR ofrecemos soluciones premium enfocadas en calidad,
          producción eficiente y alianzas estratégicas para marcas modernas.
        </p>
      </div>
    </section>
  );
};

export default BenefitsHero;