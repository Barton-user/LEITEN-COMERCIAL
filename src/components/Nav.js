"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/ciclo-vida", label: "Ciclo de vida" },
  { href: "/segmentacion", label: "Segmentación" },
  { href: "/puntuacion", label: "Puntuación" },
  { href: "/data", label: "Data" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="topbar">
      <h1>
        CRM Comercial <span>· Leiten · Sinis · Barton</span>
      </h1>
      <nav className="mainnav">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={path === l.href ? "active" : ""}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
