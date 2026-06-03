"use client";

import { useEffect, useRef, useState } from "react";

const CollectionsBanner = () => {
  const sRef = useRef<HTMLDivElement>(null);
  const [sVisible, setSVisible] = useState(false);

  useEffect(() => {
    const el = sRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSVisible(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section style={{ background: "#0f0d0b", padding: "6rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          ref={sRef}
          style={{
            position: "relative", borderRadius: "40px", overflow: "hidden",
            minHeight: "700px", display: "flex", alignItems: "center",
            border: "1px solid rgba(196,163,90,0.2)",
            backgroundImage: "url('/fotoColeccion2.jpg')",
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: sVisible ? 1 : 0,
            transform: sVisible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.98)",
            transition: "all 1s ease",
            boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
            willChange: "transform",
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            e.currentTarget.style.transform = `perspective(1200px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) scale(1.01)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "perspective(1200px) rotateY(0) rotateX(0) scale(1)";
          }}
        >
          {/* Overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to right, rgba(15,13,11,0.9), rgba(15,13,11,0.3), transparent)",
          }} />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, padding: "4rem 5rem", maxWidth: "620px" }}>
            <p style={{
              fontSize: "11px", fontWeight: 900, textTransform: "uppercase",
              letterSpacing: "0.4em", color: "#c4a35a", marginBottom: "1.5rem",
            }}>
              Editorial Fashion
            </p>

            <h2 style={{
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 900,
              fontStyle: "italic", lineHeight: 1,
              color: "#fdf9f3", marginBottom: "1.5rem",
            }}>
              Moda diseñada
              <br />para marcas
              <br /><span style={{ color: "#c4a35a" }}>modernas.</span>
            </h2>

            <div style={{ width: "60px", height: "3px", background: "linear-gradient(90deg,#c4a35a,transparent)", marginBottom: "1.5rem" }} />

            <p style={{ fontSize: "1.05rem", lineHeight: 1.8, color: "rgba(253,249,243,0.65)", margin: 0 }}>
              Producción textil premium con visión estratégica, identidad
              visual y excelencia operativa.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollectionsBanner;