import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "CRM Comercial · Leiten · Sinis · Barton",
  description: "Gestión de ciclo de vida y segmentación de clientes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
