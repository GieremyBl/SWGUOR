"use client";

import { useEffect, useRef, useState } from "react";

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

const collections = [
  { title: "Blazer Ejecutivo Premium", image: "/fotoModa1.jpg" },
  { title: "Conjunto Corporativo Beige", image: "/fotoModa2.jpg" },
  { title: "Vestido Urbano Elegance", image: "/fotoModa3.jpg" },
  { title: "Abrigo Luxury Black", image: "/fotoModa4.jpg" },
];

const CollectionsGrid = () => {
  const s = useScrollReveal();

  return (
    <section style={{ background: "#0a0806", padding: "6rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          ref={s.ref}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
          className="col-grid"
        >
          {collections.map((item, i) => (
            <div
              key={i}
              style={{
                position: "relative", borderRadius: "32px", overflow: "hidden",
                minHeight: "500px",
                border: "1px solid rgba(196,163,90,0.15)",
                backgroundImage: `url('${item.image}')`,
                backgroundSize: "cover", backgroundPosition: "center",
                cursor: "pointer", willChange: "transform",
                opacity: s.visible ? 1 : 0,
                transform: s.visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.97)",
                transition: `all 0.8s ease ${i * 0.12}s`,
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                e.currentTarget.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.02)`;
                e.currentTarget.style.boxShadow = "0 30px 60px rgba(0,0,0,0.6)";
                e.currentTarget.style.borderColor = "rgba(196,163,90,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "perspective(900px) rotateY(0) rotateX(0) scale(1)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "rgba(196,163,90,0.15)";
              }}
            >
              {/* Overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(15,13,11,0.8), rgba(15,13,11,0.1), transparent)",
                transition: "background 0.4s ease",
              }} />

              {/* Text */}
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                justifyContent: "flex-end", padding: "2.5rem",
              }}>
                <p style={{
                  fontSize: "10px", fontWeight: 900, textTransform: "uppercase",
                  letterSpacing: "0.35em", color: "#c4a35a", marginBottom: "0.5rem",
                }}>
                  GUOR Collection
                </p>
                <h2 style={{
                  fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 900,
                  fontStyle: "italic", color: "#fdf9f3", margin: 0,
                  textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                }}>
                  {item.title}
                </h2>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .col-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

export default CollectionsGrid;