"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/vendedor/dia", ic: "📅", lb: "Mi Día" },
  { href: "/vendedor/mapa", ic: "📍", lb: "Mapa" },
  { href: "/vendedor/oportunidades", ic: "🎯", lb: "Oportunidades" },
  { href: "/vendedor/resumen", ic: "📊", lb: "Resumen" },
  { href: "/vendedor/cotizar", ic: "💰", lb: "Cotizar" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="mv-bnav">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={path === t.href ? "active" : ""}>
          <span className="ic">{t.ic}</span>
          <span className="lb">{t.lb}</span>
        </Link>
      ))}
    </nav>
  );
}
