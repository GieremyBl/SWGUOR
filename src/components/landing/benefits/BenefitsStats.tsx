"use client";

import { useEffect, useRef, useState } from "react";

function useScrollReveal(threshold = 0.2) {
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

const stats = [
  { number: "+6", label: "Años de experiencia" },
  { number: "100%", label: "Compromiso premium" },
  { number: "B2B", label: "Enfoque estratégico" },
  { number: "24/7", label: "Atención corporativa" },
];

const BenefitsStats = () => {
  const s = useScrollReveal();

  return (
    <section style={{ background: "#0f0d0b", padding: "2rem 2rem 4rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          ref={s.ref}
          style={{
            borderRadius: "32px",
            background: "linear-gradient(135deg, rgba(196,163,90,0.08) 0%, rgba(196,163,90,0.02) 100%)",
            border: "1px solid rgba(196,163,90,0.2)",
            padding: "3rem",
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0",
          }}
          className="stats-grid"
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                textAlign: "center", padding: "1.5rem 2rem",
                borderRight: i < 3 ? "1px solid rgba(196,163,90,0.15)" : "none",
                opacity: s.visible ? 1 : 0,
                transform: s.visible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.7s ease ${i * 0.1}s`,
              }}
            >
              <p style={{
                fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 900,
                fontStyle: "italic", color: "#c4a35a", margin: 0, lineHeight: 1,
              }}>
                {stat.number}
              </p>
              <div style={{ width: "30px", height: "2px", background: "rgba(196,163,90,0.4)", margin: "0.75rem auto" }} />
              <p style={{
                fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.2em", color: "rgba(253,249,243,0.5)", margin: 0,
              }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
};

export default BenefitsStats;