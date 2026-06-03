"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const AboutHero = () => {
  const textRef  = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [textVisible,  setTextVisible]  = useState(false);
  const [imageVisible, setImageVisible] = useState(false);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const observe = (
      el: HTMLDivElement | null,
      setVisible: (v: boolean) => void,
      threshold = 0.15,
    ) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
        { threshold },
      );
      obs.observe(el);
      observers.push(obs);
    };

    observe(textRef.current,  setTextVisible);
    observe(imageRef.current, setImageVisible);

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section
      style={{
        background: "#0f0d0b",
        padding: "10rem 2rem 6rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.035, pointerEvents: "none",
        backgroundImage: "linear-gradient(#c4a35a 1px,transparent 1px),linear-gradient(90deg,#c4a35a 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      {/* Glow orb */}
      <div style={{
        position: "absolute", top: "-100px", right: "10%",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle,rgba(196,163,90,0.07) 0%,transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Badge */}
        <div ref={textRef} style={{
          opacity: textVisible ? 1 : 0,
          transform: textVisible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s ease",
        }}>
          <span style={{
            display: "inline-block", padding: "6px 20px", borderRadius: "100px",
            background: "rgba(196,163,90,0.08)", border: "1px solid rgba(196,163,90,0.35)",
            color: "#c4a35a", fontSize: "10px", fontWeight: 900,
            letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: "3rem",
          }}>
            Nosotros
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }}
          className="about-grid">

          {/* TEXT */}
          <div style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? "translateX(0)" : "translateX(-40px)",
            transition: "all 0.9s ease 0.1s",
          }}>
            <h1 style={{
              fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
              fontWeight: 900, fontStyle: "italic",
              lineHeight: 1, color: "#fdf9f3",
              marginBottom: "1.5rem",
            }}>
              Más que confección,
              <br />
              <span style={{ color: "#c4a35a" }}>creamos experiencia.</span>
            </h1>

            <div style={{ width: "60px", height: "3px", background: "linear-gradient(90deg,#c4a35a,transparent)", marginBottom: "2rem" }} />

            <p style={{
              fontSize: "1.15rem", lineHeight: 1.8,
              color: "rgba(253,249,243,0.6)", margin: 0,
            }}>
              En GUOR transformamos ideas en prendas con identidad, fusionando
              excelencia textil, producción premium y visión estratégica para
              negocios modernos.
            </p>
          </div>

          {/* IMAGE with 3D tilt */}
          <div
            ref={imageRef}
            style={{
              borderRadius: "32px", overflow: "hidden",
              border: "1px solid rgba(196,163,90,0.2)",
              minHeight: "560px", position: "relative",
              opacity: imageVisible ? 1 : 0,
              transform: imageVisible ? "translateX(0) rotateY(0deg)" : "translateX(40px) rotateY(8deg)",
              transition: "all 1s ease 0.2s",
              boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width - 0.5;
              const y = (e.clientY - rect.top) / rect.height - 0.5;
              e.currentTarget.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "perspective(800px) rotateY(0) rotateX(0) scale(1)";
            }}
          >
            <Image
              src="/fotoAbout1.jpg"
              alt="Modas y Estilos GUOR"
              fill
              className="object-cover object-center"
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(15,13,11,0.6) 0%, transparent 50%)",
            }} />
            {/* Floating badge on image */}
            <div style={{
              position: "absolute", bottom: "2rem", left: "2rem",
              padding: "12px 20px", borderRadius: "16px",
              background: "rgba(15,13,11,0.85)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(196,163,90,0.3)",
            }}>
              <p style={{ fontSize: "10px", color: "#c4a35a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>
                Desde 2020
              </p>
              <p style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fdf9f3", margin: "2px 0 0" }}>
                +6 Años de experiencia
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
        }
      `}</style>
    </section>
  );
};

export default AboutHero;