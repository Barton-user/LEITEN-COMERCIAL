"use client";
import { ET, ET_ORDER, MARCA_COLOR, money } from "@/lib/pipeline";
import { useOps } from "@/components/vendedor/useOps";

export default function Resumen({ ops: serverOps }) {
  const ops = useOps(serverOps);
  const activas = ops.filter((o) => o.estado !== "ganada" && o.estado !== "entregado");
  const ganadas = ops.filter((o) => o.estado === "ganada");
  const valorJuego = activas.reduce((s, o) => s + (o.valor || 0), 0);
  const valorGanado = ganadas.reduce((s, o) => s + (o.valor || 0), 0);
  // ponderado por probabilidad
  const forecast = activas.reduce((s, o) => s + (o.valor || 0) * (ET[o.estado]?.prob || 0) / 100, 0);

  const porEtapa = ET_ORDER.map((k) => ({ k, et: ET[k], lista: ops.filter((o) => o.estado === k) })).filter((x) => x.lista.length);
  const maxN = Math.max(1, ...porEtapa.map((x) => x.lista.length));

  const porEmpresa = ["Leiten", "Sinis", "Barton"].map((e) => ({
    e, n: ops.filter((o) => o.empresa === e).length,
    valor: ops.filter((o) => o.empresa === e).reduce((s, o) => s + (o.valor || 0), 0),
  })).filter((x) => x.n);

  const kpi = (label, val, color) => (
    <div className="mv-sum" style={{ background: color, minWidth: 150, flex: 1 }}>
      <div className="n">{val}</div><div className="l">{label}</div>
    </div>
  );

  return (
    <div>
      <div className="mv-screen-t">Resumen</div>
      <div className="mv-screen-s">Mis números — pipeline actual.</div>

      <div className="mv-summary" style={{ flexWrap: "wrap", borderBottom: "none", marginTop: 8 }}>
        {kpi("Activas", activas.length, "#0077cc")}
        {kpi("Ganadas", ganadas.length, "#4caf50")}
        {kpi("Valor en juego (USD)", money(valorJuego).replace("US$ ", ""), "#7c3aed")}
        {kpi("Forecast ponderado", money(forecast).replace("US$ ", ""), "#fb8c00")}
      </div>

      <div style={{ padding: "8px 14px" }}>
        <div className="lb-title" style={{ color: "#666", fontSize: 12, fontWeight: 700, margin: "8px 0" }}>Oportunidades por etapa</div>
        {porEtapa.map(({ k, et, lista }) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <div style={{ width: 120, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{et.nombre}</div>
            <div style={{ flex: 1, background: "#eee", borderRadius: 6, height: 18, overflow: "hidden" }}>
              <div style={{ width: `${(lista.length / maxN) * 100}%`, background: et.color, height: "100%" }} />
            </div>
            <div style={{ width: 26, textAlign: "right", fontWeight: 700, fontSize: 13 }}>{lista.length}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 14px 24px" }}>
        <div className="lb-title" style={{ color: "#666", fontSize: 12, fontWeight: 700, margin: "8px 0" }}>Por empresa</div>
        <div style={{ display: "flex", gap: 8 }}>
          {porEmpresa.map(({ e, n, valor }) => (
            <div key={e} style={{ flex: 1, background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 12, textAlign: "center" }}>
              <div className="mv-marca" style={{ background: MARCA_COLOR[e], display: "inline-block", marginBottom: 6 }}>{e}</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{n}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{money(valor)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
