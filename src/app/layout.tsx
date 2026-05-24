import type { Metadata, Viewport } from "next";
import { Inter, Great_Vibes } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
});

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-great-vibes',
});

export const metadata: Metadata = {
  title: {
    default: "GUOR | Portal Corporativo B2B",
    template: "%s | GUOR"
  },
  description: "Plataforma inteligente de gestión textil y suministros para socios estratégicos de Modas y Estilos GUOR.",
  keywords: ["B2B", "Textil", "ERP", "IA", "Gestión de Pedidos", "Perú"],
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
    <html lang="es" suppressHydrationWarning className={greatVibes.variable}>
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          inter.variable,
          inter.className
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