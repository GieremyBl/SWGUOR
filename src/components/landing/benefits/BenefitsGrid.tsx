"use client";

import { useEffect, useRef, useState } from "react";
import { Gem, BadgePercent, Users, Truck } from "lucide-react";

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

const benefits = [
  { title: "Producción Premium", icon: Gem, items: ["Producción eficiente", "Materiales seleccionados", "Control de calidad riguroso"] },
  { title: "Descuentos Exclusivos", icon: BadgePercent, items: ["20% en primera orden", "Beneficios recurrentes", "Precios corporativos"] },
  { title: "Atención Estratégica", icon: Users, items: ["Asesoría personalizada", "Soporte constante 24/7", "Enfoque B2B profesional"] },
  { title: "Logística Inteligente", icon: Truck, items: ["Procesos organizados", "Entregas eficientes", "Seguimiento operativo"] },
];

const BenefitsGrid = () => {
  const s = useScrollReveal();

  return (
    <section style={{ background: "#0a0806", padding: "4rem 2rem 6rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          ref={s.ref}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}
        >
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                style={{
                  borderRadius: "28px", padding: "2.5rem",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(196,163,90,0.12)",
                  cursor: "default", willChange: "transform",
                  opacity: s.visible ? 1 : 0,
                  transform: s.visible ? "translateY(0)" : "translateY(40px)",
                  transition: `all 0.7s ease ${i * 0.1}s`,
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width - 0.5;
                  const y = (e.clientY - rect.top) / rect.height - 0.5;
                  e.currentTarget.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02) translateY(0)`;
                  e.currentTarget.style.borderColor = "rgba(196,163,90,0.4)";
                  e.currentTarget.style.boxShadow = "0 20px 50px rgba(0,0,0,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "perspective(700px) rotateY(0) rotateX(0) scale(1) translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(196,163,90,0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: "52px", height: "52px", borderRadius: "16px",
                  background: "rgba(196,163,90,0.1)", border: "1px solid rgba(196,163,90,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "1.5rem",
                }}>
                  <Icon size={22} style={{ color: "#c4a35a" }} />
                </div>

                <h3 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fdf9f3", marginBottom: "1.25rem" }}>
                  {b.title}
                </h3>

                <div style={{ width: "100%", height: "1px", background: "rgba(196,163,90,0.15)", marginBottom: "1.25rem" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {b.items.map((item) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c4a35a", flexShrink: 0 }} />
                      <p style={{ fontSize: "0.875rem", color: "rgba(253,249,243,0.55)", margin: 0 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsGrid;