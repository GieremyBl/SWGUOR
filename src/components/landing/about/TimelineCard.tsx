"use client";

import { useEffect, useRef, useState } from "react";
import { Clock3 } from "lucide-react";

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

const TimelineCard = () => {
  const section = useScrollReveal(0.1);

  return (
    <section style={{ background: "#0f0d0b", padding: "6rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div
          ref={section.ref}
          style={{
            borderRadius: "40px", padding: "4rem",
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(196,163,90,0.15)",
            display: "grid", gridTemplateColumns: "1fr 1.4fr",
            gap: "4rem", alignItems: "center",
            opacity: section.visible ? 1 : 0,
            transform: section.visible ? "translateY(0)" : "translateY(50px)",
            transition: "all 0.9s ease",
          }}
          className="timeline-grid"
        >
          {/* LEFT — image card */}
          <div
            style={{
              position: "relative", borderRadius: "28px", overflow: "hidden",
              minHeight: "440px",
              border: "1px solid rgba(196,163,90,0.2)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
              transition: "transform 0.35s ease",
              cursor: "default",
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width - 0.5;
              const y = (e.clientY - rect.top) / rect.height - 0.5;
              e.currentTarget.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "perspective(700px) rotateY(0) rotateX(0) scale(1)";
            }}
          >
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "url('/fotoAbout2.jpg')",
              backgroundSize: "cover", backgroundPosition: "center",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(15,13,11,0.85), rgba(15,13,11,0.25))",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              textAlign: "center", padding: "2rem",
            }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "rgba(196,163,90,0.15)",
                border: "2px solid rgba(196,163,90,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1.5rem",
              }}>
                <Clock3 size={36} style={{ color: "#c4a35a" }} />
              </div>
              <h2 style={{ fontSize: "4rem", fontWeight: 900, fontStyle: "italic", color: "#fdf9f3", margin: 0, lineHeight: 1 }}>
                6 Años
              </h2>
              <div style={{ width: "40px", height: "2px", background: "#c4a35a", margin: "1rem auto" }} />
              <p style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(196,163,90,0.8)", margin: 0 }}>
                Desde 2020
              </p>
            </div>
          </div>

          {/* RIGHT — text */}
          <div>
            <p style={{
              fontSize: "10px", fontWeight: 900, textTransform: "uppercase",
              letterSpacing: "0.35em", color: "#c4a35a", marginBottom: "1.25rem",
            }}>
              Quiénes Somos
            </p>

            <h2 style={{
              fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)", fontWeight: 900,
              fontStyle: "italic", lineHeight: 1.05,
              color: "#fdf9f3", marginBottom: "1.5rem",
            }}>
              Aliados Estratégicos
              <br />
              <span style={{ color: "#c4a35a" }}>de la Moda Mayorista</span>
            </h2>

            <div style={{ width: "50px", height: "2px", background: "#c4a35a", marginBottom: "1.75rem" }} />

            <p style={{ fontSize: "1.05rem", lineHeight: 1.8, color: "rgba(253,249,243,0.6)", margin: 0 }}>
              Modas y Estilos GUOR S.A.C. nace con el propósito de elevar la
              confección textil mediante procesos eficientes, atención estratégica
              y estándares premium que marcan la diferencia en cada prenda.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .timeline-grid { grid-template-columns: 1fr !important; padding: 2rem !important; }
        }
      `}</style>
    </section>
  );
};

export default TimelineCard;