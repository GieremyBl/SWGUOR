"use client";

import { useEffect, useRef, useState } from "react";
import { Target, Eye } from "lucide-react";

const MissionVision = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSectionVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section style={{ background: "#0a0806", padding: "6rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div
          ref={sectionRef}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}
          className="mv-grid"
        >

          {/* MISIÓN */}
          <div
            style={{
              borderRadius: "32px", padding: "3.5rem",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(196,163,90,0.15)",
              opacity: sectionVisible ? 1 : 0,
              transform: sectionVisible ? "translateY(0)" : "translateY(40px)",
              transition: "all 0.8s ease",
              cursor: "default",
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width - 0.5;
              const y = (e.clientY - rect.top) / rect.height - 0.5;
              e.currentTarget.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(0)`;
              e.currentTarget.style.borderColor = "rgba(196,163,90,0.4)";
              e.currentTarget.style.boxShadow = "0 20px 60px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "perspective(800px) rotateY(0) rotateX(0) translateY(0)";
              e.currentTarget.style.borderColor = "rgba(196,163,90,0.15)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: "52px", height: "52px", borderRadius: "16px",
              background: "rgba(196,163,90,0.1)", border: "1px solid rgba(196,163,90,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "2rem",
            }}>
              <Target size={24} style={{ color: "#c4a35a" }} />
            </div>

            <p style={{
              fontSize: "10px", fontWeight: 900, textTransform: "uppercase",
              letterSpacing: "0.35em", color: "#c4a35a", marginBottom: "1rem",
            }}>
              Misión
            </p>

            <h2 style={{
              fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 900,
              fontStyle: "italic", lineHeight: 1.1,
              color: "#fdf9f3", marginBottom: "1.5rem",
            }}>
              Calidad con
              <br />propósito.
            </h2>

            <div style={{ width: "40px", height: "2px", background: "#c4a35a", marginBottom: "1.5rem" }} />

            <p style={{ fontSize: "1.05rem", lineHeight: 1.8, color: "rgba(253,249,243,0.55)", margin: 0 }}>
              Brindar soluciones textiles premium para negocios y marcas
              que buscan calidad, puntualidad y producción eficiente.
            </p>
          </div>

          {/* VISIÓN */}
          <div
            style={{
              borderRadius: "32px", padding: "3.5rem",
              background: "linear-gradient(135deg, rgba(196,163,90,0.08) 0%, rgba(196,163,90,0.02) 100%)",
              border: "1px solid rgba(196,163,90,0.25)",
              opacity: sectionVisible ? 1 : 0,
              transform: sectionVisible ? "translateY(0)" : "translateY(40px)",
              transition: "all 0.8s ease 0.15s",
              cursor: "default",
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width - 0.5;
              const y = (e.clientY - rect.top) / rect.height - 0.5;
              e.currentTarget.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(0)`;
              e.currentTarget.style.boxShadow = "0 20px 60px rgba(196,163,90,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "perspective(800px) rotateY(0) rotateX(0) translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: "52px", height: "52px", borderRadius: "16px",
              background: "rgba(196,163,90,0.15)", border: "1px solid rgba(196,163,90,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "2rem",
            }}>
              <Eye size={24} style={{ color: "#c4a35a" }} />
            </div>

            <p style={{
              fontSize: "10px", fontWeight: 900, textTransform: "uppercase",
              letterSpacing: "0.35em", color: "#c4a35a", marginBottom: "1rem",
            }}>
              Visión
            </p>

            <h2 style={{
              fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 900,
              fontStyle: "italic", lineHeight: 1.1,
              color: "#fdf9f3", marginBottom: "1.5rem",
            }}>
              Liderar la
              <br />moda B2B.
            </h2>

            <div style={{ width: "40px", height: "2px", background: "#c4a35a", marginBottom: "1.5rem" }} />

            <p style={{ fontSize: "1.05rem", lineHeight: 1.8, color: "rgba(253,249,243,0.55)", margin: 0 }}>
              Consolidarnos como referente nacional en confección
              mayorista, innovación operativa y excelencia textil.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .mv-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

export default MissionVision;