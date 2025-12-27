import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
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
      <body className={`min-h-screen bg-background antialiased ${inter.variable}`}
      >
        {children}
      <Toaster />
      </body>
    </html>
  );
}