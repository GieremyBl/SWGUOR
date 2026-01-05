import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap', // Mejora la carga de fuentes
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
    <html lang="es">
      <head>
        {/* Preconnect a Supabase para mejorar velocidad */}
        <link rel="preconnect" href="https://fkpvmgfsopjhvorckost.supabase.co" />
        <link rel="dns-prefetch" href="https://fkpvmgfsopjhvorckost.supabase.co" />
        
        {/* Preload de fuentes críticas */}
        <link
          rel="preload"
          href="/costura.jpg"
          as="image"
          type="image/jpeg"
        />
      </head>
      <body className={`min-h-screen bg-background antialiased ${inter.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}