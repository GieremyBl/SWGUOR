"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { question: "¿Cómo funciona la alianza estratégica con GUOR?", answer: "Trabajamos junto a marcas y negocios ofreciendo producción textil premium, asesoría estratégica y atención personalizada para potenciar cada colección." },
  { question: "¿Existe un pedido mínimo para empresas?", answer: "Sí. Dependiendo del tipo de prenda y producción, manejamos cantidades mínimas adaptadas a cada cliente corporativo." },
  { question: "¿Cómo accedo al descuento de primera orden?", answer: "Al registrarte como nuevo socio estratégico, activamos automáticamente el beneficio exclusivo del 20% en tu primera producción." },
  { question: "¿Qué tipo de prendas producen?", answer: "Desarrollamos colecciones urbanas, corporativas, premium y moda personalizada para negocios modernos." },
  { question: "¿GUOR realiza envíos y seguimiento?", answer: "Sí. Contamos con logística inteligente, seguimiento operativo y atención constante durante todo el proceso." },
];

const QuestionsAccordion = () => {
  const [active, setActive] = useState<number | null>(0);

  const titleRef = useRef<HTMLDivElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const [titleVisible, setTitleVisible] = useState(false);
  const [listVisible,  setListVisible]  = useState(false);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const observe = (
      el: HTMLDivElement | null,
      setVisible: (v: boolean) => void,
      threshold = 0.1,
    ) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
        { threshold },
      );
      obs.observe(el);
      observers.push(obs);
    };

    observe(titleRef.current, setTitleVisible, 0.1);
    observe(listRef.current,  setListVisible,  0.05);

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section style={{ background: "#0a0806", padding: "6rem 2rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Title */}
        <div ref={titleRef} style={{
          textAlign: "center", marginBottom: "4rem",
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s ease",
        }}>
          <span style={{
            display: "inline-block", padding: "6px 18px", borderRadius: "100px",
            background: "rgba(196,163,90,0.08)", border: "1px solid rgba(196,163,90,0.3)",
            color: "#c4a35a", fontSize: "10px", fontWeight: 900,
            letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "1.5rem",
          }}>
            Preguntas Frecuentes
          </span>
          <h2 style={{
            fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)", fontWeight: 900,
            fontStyle: "italic", lineHeight: 1.05, color: "#fdf9f3", margin: "0 0 1rem",
          }}>
            Todo lo que necesitas
            <br />saber sobre <span style={{ color: "#c4a35a" }}>GUOR.</span>
          </h2>
          <div style={{ width: "50px", height: "2px", background: "#c4a35a", margin: "0 auto" }} />
        </div>

        {/* FAQ list */}
        <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {faqs.map((faq, i) => {
            const isOpen = active === i;
            return (
              <div
                key={i}
                style={{
                  borderRadius: "20px", overflow: "hidden",
                  border: `1px solid ${isOpen ? "rgba(196,163,90,0.4)" : "rgba(196,163,90,0.12)"}`,
                  background: isOpen ? "rgba(196,163,90,0.05)" : "rgba(255,255,255,0.015)",
                  transition: "all 0.4s ease",
                  boxShadow: isOpen ? "0 8px 32px rgba(0,0,0,0.3)" : "none",
                  opacity: listVisible ? 1 : 0,
                  transform: listVisible ? "translateX(0)" : "translateX(-20px)",
                  transitionDelay: `${i * 0.07}s`,
                }}
              >
                <button
                  onClick={() => setActive(isOpen ? null : i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "1.75rem 2rem",
                    background: "transparent", border: "none", cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <h3 style={{
                    fontSize: "1.05rem", fontWeight: 900,
                    color: isOpen ? "#fdf9f3" : "rgba(253,249,243,0.75)",
                    paddingRight: "1rem", margin: 0,
                    transition: "color 0.3s",
                  }}>
                    {faq.question}
                  </h3>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                    background: isOpen ? "#c4a35a" : "rgba(196,163,90,0.1)",
                    border: `1px solid ${isOpen ? "#c4a35a" : "rgba(196,163,90,0.25)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}>
                    <ChevronDown
                      size={16}
                      style={{
                        color: isOpen ? "#0f0d0b" : "#c4a35a",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "all 0.3s ease",
                      }}
                    />
                  </div>
                </button>

                <div style={{
                  maxHeight: isOpen ? "300px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.4s ease",
                }}>
                  <div style={{ padding: "0 2rem 2rem" }}>
                    <div style={{ width: "30px", height: "1px", background: "rgba(196,163,90,0.4)", marginBottom: "1rem" }} />
                    <p style={{
                      fontSize: "0.95rem", lineHeight: 1.8,
                      color: "rgba(253,249,243,0.55)", margin: 0,
                    }}>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default QuestionsAccordion;