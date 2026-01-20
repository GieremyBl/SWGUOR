import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { Inter, Playfair_Display } from 'next/font/google';

// Fuente para CUERPO Y DATOS (Limpia y funcional)
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap', 
});

// Fuente para TÍTULOS Y MARCA (Elegancia de moda)
const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-serif",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Modas y Estilos Guor - Sistema de Gestión",
  description: "Sistema de Gestión Textil",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Preconnect a Supabase para mejorar velocidad */}
        <link rel="preconnect" href="https://fkpvmgfsopjhvorckost.supabase.co" />
        <link rel="dns-prefetch" href="https://fkpvmgfsopjhvorckost.supabase.co" />
        
        {/* Preload de fuentes críticas */}
        <link
          rel="preload"
          href="/costura.webp"
          as="image"
          type="image/webp"
        />
      </head>
      {/* Añadimos font-sans por defecto para que todo el cuerpo la use */}
      <body className="min-h-screen bg-background antialiased font-sans">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}