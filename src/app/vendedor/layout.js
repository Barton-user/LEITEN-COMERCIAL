import "./vendedor.css";
import Link from "next/link";
import BottomNav from "@/components/vendedor/BottomNav";

export const metadata = { title: "Ventas · Leiten · Sinis · Barton" };

export default function VendedorLayout({ children }) {
  return (
    <div className="mv-backdrop">
      <div className="mv-app">
        <header className="mv-hdr">
          <div>
            <div className="mv-brands">
              <span className="mv-brand">LEITEN</span>
              <span className="mv-sep" />
              <span className="mv-brand">SINIS</span>
              <span className="mv-sep" />
              <span className="mv-brand barton">BARTON</span>
            </div>
            <div className="mv-sub">Ventas</div>
          </div>
          <div className="mv-hdr-r">
            <Link href="/ciclo-vida" className="mv-back">← CRM</Link>
            <div className="mv-av">JG</div>
          </div>
        </header>
        <div className="mv-body">{children}</div>
        <BottomNav />
      </div>
    </div>
  );
}
