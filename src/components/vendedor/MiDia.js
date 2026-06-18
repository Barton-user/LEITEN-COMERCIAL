"use client";
import { useState } from "react";
import { ET, MARCA_COLOR } from "@/lib/pipeline";
import { useOps } from "@/components/vendedor/useOps";
import OpDetail from "@/components/vendedor/OpDetail";

const ACT_IC = { llamado: "📞", visita_obra: "📍", demo: "⚙️", reunion: "🤝", cotizacion: "📄", relevamiento: "🔍" };

function dias(fechaISO) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return Math.round((new Date(fechaISO + "T00:00:00") - hoy) / 86400000);
}

export default function MiDia({ ops: serverOps }) {
  const ops = useOps(serverOps);
  const [sel, setSel] = useState(null);

  const activas = ops.filter((o) => o.estado !== "ganada" && o.estado !== "entregado" && o.proxAct?.fecha);
  const vencidas = activas.filter((o) => dias(o.proxAct.fecha) < 0).sort((a, b) => a.proxAct.fecha.localeCompare(b.proxAct.fecha));
  const hoy = activas.filter((o) => dias(o.proxAct.fecha) === 0);
  const semana = activas.filter((o) => { const d = dias(o.proxAct.fecha); return d > 0 && d <= 7; }).sort((a, b) => a.proxAct.fecha.localeCompare(b.proxAct.fecha));

  const hoyStr = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  const Card = ({ o }) => {
    const et = ET[o.estado];
    const d = dias(o.proxAct.fecha);
    const venc = d < 0 ? `Vencida hace ${-d}d` : d === 0 ? "Hoy" : `En ${d}d`;
    return (
      <div className="mv-card" style={{ borderLeftColor: MARCA_COLOR[o.empresa], marginBottom: 8 }} onClick={() => setSel(o)}>
        <div className="mv-card-r1">
          <div className="mv-card-name">{ACT_IC[o.proxAct.tipo] || "•"} {o.proxAct.tipo}</div>
          <span className={"mv-venc " + (d < 0 ? "exp" : d === 0 ? "warn" : "ok")}>{venc}</span>
        </div>
        <div className="mv-card-sub">{o.nombre}</div>
        <div className="mv-card-meta">
          <span className="mv-marca" style={{ background: MARCA_COLOR[o.empresa] }}>{o.empresa}</span>
          <span className="mv-tag">{o.cliente}</span>
          <span className="mv-tag" style={{ background: "#f3e9ff", color: et.color }}>{et.nombre}</span>
        </div>
      </div>
    );
  };

  const Sec = ({ titulo, color, items }) =>
    items.length ? (
      <div style={{ padding: "0 14px 6px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color, margin: "12px 0 6px" }}>
          {titulo} · {items.length}
        </div>
        {items.map((o) => <Card key={o.id} o={o} />)}
      </div>
    ) : null;

  return (
    <div>
      <div className="mv-screen-t">Mi Día</div>
      <div className="mv-screen-s" style={{ textTransform: "capitalize" }}>{hoyStr}</div>
      {vencidas.length + hoy.length + semana.length === 0 && (
        <div className="mv-soon"><span className="ic">✅</span>Sin pendientes próximos. ¡Al día!</div>
      )}
      <Sec titulo="Vencidas" color="#c62828" items={vencidas} />
      <Sec titulo="Para hoy" color="#e65100" items={hoy} />
      <Sec titulo="Esta semana" color="#1565c0" items={semana} />
      {sel && <OpDetail op={sel} onClose={() => setSel(null)} />}
    </div>
  );
}
