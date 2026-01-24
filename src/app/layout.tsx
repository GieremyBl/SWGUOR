import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sistema GUOR - Gestión de Modas",
  description: "Panel administrativo y control de inventarios",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* El Toaster para notificaciones debe ir aquí para que funcione en todo el sitio */}
        <Toaster position="top-right" richColors closeButton />
        
        {/* Aquí simplemente renderizamos el contenido sin lógica de redirección */}
        {children}
      </body>
    </html>
  );
}