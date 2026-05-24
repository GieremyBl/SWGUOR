"use client";

import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer
      className="mt-auto py-14"
      style={{
        background: "#211f1d",
        borderTop: "1px solid rgba(196,163,90,0.30)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-14 items-start">

          {/* LOGO */}
          <div className="text-center md:text-left">
            <div className="flex justify-center md:justify-start mb-3">
              <Image
                src="/logo-oscuro.png"
                alt="GUOR Logo"
                width={200}
                height={150}
                className="object-contain"
              />
            </div>
            <div className="w-10 h-px mb-4" style={{ background: "#c4a35a" }} />
            <p className="text-base leading-relaxed max-w-sm mx-auto md:mx-0" style={{ color: "rgba(253,249,243,0.62)" }}>
              Moda y confección premium para negocios modernos.
            </p>
          </div>

          {/* CONTACTO */}
          <div className="text-center">
            <h3 className="text-xl font-black mb-1 uppercase tracking-widest" style={{ color: "#c4a35a" }}>
              Contacto
            </h3>
            <div className="w-6 h-px mx-auto mb-5" style={{ background: "rgba(196,163,90,0.35)" }} />
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Phone size={16} color="#c4a35a" />
                <span className="text-base" style={{ color: "#fdf9f3" }}>+51 908 801 912</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <MapPin size={16} color="#c4a35a" />
                <span className="text-base" style={{ color: "#fdf9f3" }}>Tienda Virtual</span>
              </div>
            </div>
          </div>

          {/* REDES */}
          <div className="text-center md:text-right">
            <h3 className="text-xl font-black mb-1 uppercase tracking-widest" style={{ color: "#c4a35a" }}>
              Redes Sociales
            </h3>
            <div className="w-6 h-px ml-auto mr-auto md:mr-0 mb-5" style={{ background: "rgba(196,163,90,0.35)" }} />
            <div className="flex justify-center md:justify-end gap-4">
              <Link
                href="https://www.instagram.com/giobrand.pe?igsh=MTZzZHNkMXc3cDZo"
                target="_blank"
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1"
                style={{ background: "rgba(196,163,90,0.12)", border: "1px solid rgba(196,163,90,0.25)", color: "#c4a35a" }}
              >
                <Instagram size={22} />
              </Link>
              <Link
                href="https://www.facebook.com/share/18ZangYR1J/"
                target="_blank"
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1"
                style={{ background: "rgba(196,163,90,0.12)", border: "1px solid rgba(196,163,90,0.25)", color: "#c4a35a" }}
              >
                <Facebook size={22} />
              </Link>
            </div>
          </div>
        </div>

        {/* LÍNEA */}
        <div className="my-10" style={{ height: "1px", background: "rgba(196,163,90,0.15)" }} />

        {/* BOTTOM */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs tracking-[0.3em] uppercase" style={{ color: "rgba(253,249,243,0.35)" }}>
            © 2026 Modas y Estilos GUOR S.A.C.
          </p>
          <p className="text-xs tracking-wider" style={{ color: "rgba(196,163,90,0.45)" }}>
            Excelencia en cada puntada.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;