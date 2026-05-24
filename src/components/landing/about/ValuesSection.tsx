"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Gem, Truck, Users } from "lucide-react";

function useScrollReveal(threshold = 0.1) {
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

const values = [
  { title: "Producción Premium", icon: Gem, text: "Materiales seleccionados y acabados de alta calidad en cada prenda." },
  { title: "Atención Estratégica", icon: Users, text: "Asesoría personalizada para cada cliente y negocio." },
  { title: "Logística Inteligente", icon: Truck, text: "Procesos eficientes y entregas optimizadas sin demoras." },
  { title: "Confianza Corporativa", icon: ShieldCheck, text: "Relaciones comerciales sólidas, transparentes y duraderas." },
];

const ValuesSection = () => {
  const title = useScrollReveal();
  const cards = useScrollReveal(0.1);

  return (
    <section style={{ background: "#0a0806", padding: "8rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Title */}
        <div ref={title.ref} style={{
          textAlign: "center", marginBottom: "5rem",
          opacity: title.visible ? 1 : 0,
          transform: title.visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s ease",
        }}>
          <span style={{
            display: "inline-block", padding: "6px 20px", borderRadius: "100px",
            background: "rgba(196,163,90,0.08)", border: "1px solid rgba(196,163,90,0.3)",
            color: "#c4a35a", fontSize: "10px", fontWeight: 900,
            letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: "1.5rem",
          }}>
            Diferenciales
          </span>
          <h2 style={{
            fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 900,
            fontStyle: "italic", color: "#fdf9f3", margin: "0 0 1rem",
          }}>
            ¿Por qué elegir{" "}
            <span style={{ color: "#c4a35a" }}>GUOR?</span>
          </h2>
          <div style={{ width: "50px", height: "2px", background: "#c4a35a", margin: "0 auto" }} />
        </div>

        {/* Cards grid */}
        <div
          ref={cards.ref}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {values.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                style={{
                  borderRadius: "28px", padding: "2.5rem",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(196,163,90,0.12)",
                  cursor: "default",
                  opacity: cards.visible ? 1 : 0,
                  transform: cards.visible ? "translateY(0)" : "translateY(40px)",
                  transition: `all 0.7s ease ${i * 0.1}s`,
                  willChange: "transform",
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width - 0.5;
                  const y = (e.clientY - rect.top) / rect.height - 0.5;
                  e.currentTarget.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.03) translateY(0)`;
                  e.currentTarget.style.borderColor = "rgba(196,163,90,0.4)";
                  e.currentTarget.style.boxShadow = "0 20px 50px rgba(0,0,0,0.4), 0 0 30px rgba(196,163,90,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `perspective(700px) rotateY(0) rotateX(0) scale(1) translateY(0)`;
                  e.currentTarget.style.borderColor = "rgba(196,163,90,0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: "52px", height: "52px", borderRadius: "16px",
                  background: "rgba(196,163,90,0.1)", border: "1px solid rgba(196,163,90,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "1.75rem",
                }}>
                  <Icon size={22} style={{ color: "#c4a35a" }} />
                </div>

                <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fdf9f3", marginBottom: "0.75rem" }}>
                  {item.title}
                </h3>

                <div style={{ width: "30px", height: "2px", background: "#c4a35a", marginBottom: "1rem" }} />

                <p style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "rgba(253,249,243,0.5)", margin: 0 }}>
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;