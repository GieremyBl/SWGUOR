"use client";

import { useEffect, useRef, useState } from "react";

function useScrollReveal(threshold = 0.1) {
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

const CollectionsHero = () => {
  const { ref: textRef, visible: textVisible } = useScrollReveal();
  const { ref: imageRef, visible: imageVisible } = useScrollReveal();

  return (
    <section style={{
      background: "#0f0d0b", padding: "10rem 2rem 6rem",
      position: "relative", overflow: "hidden",
    }}>
      {/* Grid texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.035, pointerEvents: "none",
        backgroundImage: "linear-gradient(#c4a35a 1px,transparent 1px),linear-gradient(90deg,#c4a35a 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }} className="col-hero-grid">

          {/* TEXT */}
          <div ref={textRef} style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? "translateX(0)" : "translateX(-40px)",
            transition: "all 0.9s ease",
          }}>
            <span style={{
              display: "inline-block", padding: "6px 20px", borderRadius: "100px",
              background: "rgba(196,163,90,0.08)", border: "1px solid rgba(196,163,90,0.35)",
              color: "#c4a35a", fontSize: "10px", fontWeight: 900,
              letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: "2rem",
            }}>
              Colecciones
            </span>

            <h1 style={{
              fontSize: "clamp(3rem, 5.5vw, 5rem)", fontWeight: 900,
              fontStyle: "italic", lineHeight: 1, color: "#fdf9f3", marginBottom: "1.5rem",
            }}>
              Diseños que elevan
              <br />
              <span style={{ color: "#c4a35a" }}>tu marca.</span>
            </h1>

            <div style={{ width: "60px", height: "3px", background: "linear-gradient(90deg,#c4a35a,transparent)", marginBottom: "2rem" }} />

            <p style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "rgba(253,249,243,0.55)", margin: 0 }}>
              Colecciones premium diseñadas para negocios modernos,
              marcas estratégicas y moda con identidad propia.
            </p>
          </div>

          {/* IMAGE 3D */}
          <div
            ref={imageRef}
            style={{
              borderRadius: "32px", overflow: "hidden",
              minHeight: "580px", position: "relative",
              border: "1px solid rgba(196,163,90,0.2)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
              backgroundImage: "url('/fotoColeccion.jpg')",
              backgroundSize: "cover", backgroundPosition: "center",
              opacity: imageVisible ? 1 : 0,
              transform: imageVisible ? "translateX(0)" : "translateX(40px)",
              transition: "all 1s ease 0.2s",
              willChange: "transform",
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width - 0.5;
              const y = (e.clientY - rect.top) / rect.height - 0.5;
              e.currentTarget.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "perspective(900px) rotateY(0) rotateX(0) scale(1)";
            }}
          >
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(15,13,11,0.5) 0%, transparent 50%)",
            }} />
            <div style={{
              position: "absolute", bottom: "2rem", left: "2rem",
              padding: "10px 18px", borderRadius: "14px",
              background: "rgba(15,13,11,0.85)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(196,163,90,0.3)",
            }}>
              <p style={{ fontSize: "10px", color: "#c4a35a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>
                GUOR Collection
              </p>
              <p style={{ fontSize: "1rem", fontWeight: 900, color: "#fdf9f3", margin: "2px 0 0" }}>
                Temporada 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .col-hero-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
        }
      `}</style>
    </section>
  );
};

export default CollectionsHero;