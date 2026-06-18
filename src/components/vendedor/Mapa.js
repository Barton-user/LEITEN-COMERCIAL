"use client";
import { MARCA_COLOR, money } from "@/lib/pipeline";
import { useOps } from "@/components/vendedor/useOps";

export default function Mapa({ ops: serverOps }) {
  const ops = useOps(serverOps);
  // Agrupar por obra
  const map = new Map();
  for (const o of ops) {
    const key = o.obra || "Sin obra";
    if (!map.has(key)) map.set(key, { obra: key, ops: [] });
    map.get(key).ops.push(o);
  }
  const obras = [...map.values()].sort((a, b) => b.ops.length - a.ops.length);

  return (
    <div>
      <div className="mv-screen-t">Mapa · Visitas a obra</div>
      <div className="mv-screen-s">Obras con oportunidades activas.</div>
      <div className="mv-banner-lock" style={{ margin: "12px 14px" }}>
        📍 El mapa en vivo con GPS y ruteo se habilita al conectar Google Maps y permisos de ubicación. Por ahora, listado de obras.
      </div>
      <div style={{ padding: "0 14px 24px" }}>
        {obras.map((g) => {
          const valor = g.ops.reduce((s, o) => s + (o.valor || 0), 0);
          const empresas = [...new Set(g.ops.map((o) => o.empresa))];
          return (
            <div key={g.obra} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>📍 {g.obra}</div>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{money(valor)}</div>
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
                {g.ops.length} oportunidad{g.ops.length > 1 ? "es" : ""} · {[...new Set(g.ops.map((o) => o.cliente))].slice(0, 2).join(", ")}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                {empresas.map((e) => (
                  <span key={e} className="mv-marca" style={{ background: MARCA_COLOR[e] }}>{e}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
