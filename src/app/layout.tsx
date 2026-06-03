import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

// Carga optimizada de la fuente para el cuerpo de texto
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: '--font-dm-sans',
});

// Carga optimizada de la fuente para los títulos elegantes (Serif)
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: {
    default: "GUOR | Portal Corporativo B2B",
    template: "%s | GUOR"
  },
  description: "Plataforma inteligente de gestión textil y suministros para socios estratégicos de Modas y Estilos GUOR.",
  keywords: ["B2B", "Textil", "ERP", "Gestión de Pedidos", "Perú"],
  authors: [{ name: "Modas y Estilos GUOR" }],
};

export const viewport: Viewport = {
  themeColor: "#0f0d0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(dmSans.variable, playfairDisplay.variable)}
    >
      <body
        className={cn(
          "min-h-screen font-sans antialiased"
        )}
        style={{ backgroundColor: "#0f0d0b", color: "#fdf9f3" }}
        suppressHydrationWarning
      >
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          theme="dark"
        />
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}