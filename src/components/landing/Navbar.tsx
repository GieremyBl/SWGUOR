"use client";

import { useState } from "react";
import { UserCircle, ShieldCheck, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Inicio", href: "/" },
  { name: "Nosotros", href: "/nosotros" },
  { name: "Beneficios", href: "/beneficios" },
  { name: "Colecciones", href: "/colecciones" },
  { name: "Preguntas", href: "/preguntas" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav
      style={{
        backgroundColor: "#211f1d",
        borderBottom: "1px solid rgba(196,163,90,0.18)",
        boxShadow: "0 4px 40px rgba(0,0,0,0.5)",
      }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-oscuro.png"
            alt="GUOR Logo"
            width={200}
            height={150}
            className="object-contain"
          />
        </Link>

        {/* LINKS DESKTOP */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="text-[11px] font-bold uppercase tracking-widest transition-colors duration-200"
                style={{ color: isActive ? "#c4a35a" : "#fdf9f3" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#c4a35a")}
                onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? "#c4a35a" : "#fdf9f3")}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* BOTONES DESKTOP */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login-admin"
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-200"
            style={{ color: "rgba(253,249,243,0.45)", border: "1px solid transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(253,249,243,0.85)";
              e.currentTarget.style.borderColor = "rgba(196,163,90,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(253,249,243,0.45)";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            <ShieldCheck size={14} />
            GUOR Corporativo
          </Link>

          <Link
            href="/login-cliente"
            className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300"
            style={{
              background: "#c4a35a",
              color: "#0f0d0b",
              border: "1.5px solid #c4a35a",
              boxShadow: "0 0 20px rgba(196,163,90,0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#d4b472";
              e.currentTarget.style.borderColor = "#d4b472";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(196,163,90,0.45)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#c4a35a";
              e.currentTarget.style.borderColor = "#c4a35a";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(196,163,90,0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <UserCircle size={16} />
            Portal Socios
          </Link>
        </div>

        {/* MOBILE BUTTON */}
        <button
          className="md:hidden"
          style={{ color: "#fdf9f3" }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div
          className="md:hidden absolute top-20 inset-x-0 p-6 flex flex-col gap-4"
          style={{
            background: "#211f1d",
            borderBottom: "1px solid rgba(196,163,90,0.2)",
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-bold uppercase tracking-widest py-2"
              style={{ color: pathname === item.href ? "#c4a35a" : "#fdf9f3" }}
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div style={{ height: "1px", background: "rgba(196,163,90,0.2)", margin: "4px 0" }} />
          <Link
            href="/login-cliente"
            className="w-full py-3 text-center rounded-xl font-bold text-xs"
            style={{ background: "#c4a35a", color: "#0f0d0b" }}
            onClick={() => setIsOpen(false)}
          >
            Portal Socios
          </Link>
          <Link
            href="/login-admin"
            className="w-full py-3 text-center rounded-xl font-bold text-xs"
            style={{ color: "rgba(253,249,243,0.65)", border: "1px solid rgba(196,163,90,0.25)" }}
            onClick={() => setIsOpen(false)}
          >
            GUOR Corporativo
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;