"use client";
import { useEffect, useState, useCallback } from "react";

const PERIODOS = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "14d", label: "14 días" },
  { id: "mes", label: "Este mes" },
  { id: "todo", label: "Todo" },
];

// Objetivo de trabajo por defecto según el período (fichas trabajadas = 10).
const OBJETIVO_DEFAULT = { hoy: 3, "7d": 10, "14d": 18, mes: 35, todo: 120 };

function puntaje(trabajo, objetivo) {
  if (!objetivo) return 0;
  return Math.min(10, +((trabajo / objetivo) * 10).toFixed(1));
}

// Medalla según el puntaje (cumplimiento del objetivo de trabajo).
function nivel(v) {
  if (v >= 8.5) return { icon: "🥇", label: "Muy bueno", color: "#22c55e" };
  if (v >= 6.5) return { icon: "🥈", label: "Bueno", color: "#84cc16" };
  if (v >= 3.5) return { icon: "🥉", label: "Regular", color: "#f59e0b" };
  if (v > 0) return { icon: "🚩", label: "Bajo", color: "#ef4444" };
  return { icon: "⛔", label: "Sin trabajo", color: "#ef4444" };
}

export default function SegSeguimiento({ vendedores }) {
  const [period, setPeriod] = useState("14d");
  const [vendedor, setVendedor] = useState("");
  const [objetivo, setObjetivo] = useState(OBJETIVO_DEFAULT["14d"]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ period, vendedor });
    const res = await fetch(`/api/seg-seguimiento?${sp.toString()}`);
    const json = await res.json();

    // Sumar aprobaciones hechas en la app (sesión) — cuentan como trabajo de hoy.
    try {
      let log = JSON.parse(localStorage.getItem("segAprobaciones") || "[]");
      if (vendedor) log = log.filter((a) => a.vendedor === vendedor);
      const byVend = {};
      for (const a of log) byVend[a.vendedor] = (byVend[a.vendedor] || 0) + 1;
      for (const [v, n] of Object.entries(byVend)) {
        json.totals.validados += n;
        json.totals.trabajo += n;
        let row = json.porVendedor.find((r) => r.vendedor === v);
        if (!row) {
          row = { vendedor: v, sucursal: "", validados: 0, completadas: 0, trabajo: 0, pendientes: 0 };
          json.porVendedor.push(row);
        }
        row.validados += n;
        row.trabajo += n;
      }
      json.porVendedor.sort((a, b) => b.trabajo - a.trabajo || b.validados - a.validados);
    } catch (e) {}

    setData(json);
    setLoading(false);
  }, [period, vendedor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function changePeriod(p) {
    setPeriod(p);
    setObjetivo(OBJETIVO_DEFAULT[p]);
  }

  const t = data?.totals || { validados: 0, completadas: 0, trabajo: 0, pendientes: 0, paraValidar: 0 };
  const rows = (data?.porVendedor || []).slice(0, 12);
  const periodLabel = PERIODOS.find((p) => p.id === period).label.toLowerCase();

  return (
    <div className="panel-box">
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 2 }}>Seguimiento de segmentación</h3>
          <span className="muted" style={{ fontSize: 12 }}>
            Ranking por trabajo realizado (completadas + validadas) ·{" "}
            <b style={{ color: "#22c55e" }}>{t.trabajo.toLocaleString("es-AR")} fichas trabajadas</b>{" "}
            ({periodLabel})
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={vendedor} onChange={(e) => setVendedor(e.target.value)}>
            <option value="">Todos los vendedores</option>
            {vendedores.map((v) => (
              <option key={v.vendedor} value={v.vendedor}>{v.vendedor}</option>
            ))}
          </select>
          <div className="seg-period">
            {PERIODOS.map((p) => (
              <button key={p.id} className={period === p.id ? "active" : ""} onClick={() => changePeriod(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Objetivo + leyenda */}
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div className="vara-box">
          <label style={{ margin: 0 }}>Objetivo ({periodLabel}) = puntaje 10</label>
          <input
            type="number"
            min="1"
            value={objetivo}
            onChange={(e) => setObjetivo(Math.max(1, parseInt(e.target.value || "1", 10)))}
            style={{ width: 70 }}
          />
          <span className="muted" style={{ fontSize: 11.5 }}>fichas trabajadas</span>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12 }}>
          <span><span style={{ fontSize: 14 }}>🥇</span> <b style={{ color: "#22c55e" }}>Muy bueno</b></span>
          <span><span style={{ fontSize: 14 }}>🥈</span> <b style={{ color: "#84cc16" }}>Bueno</b></span>
          <span><span style={{ fontSize: 14 }}>🥉</span> <b style={{ color: "#f59e0b" }}>Regular</b></span>
          <span><span style={{ fontSize: 14 }}>🚩</span> <b style={{ color: "#ef4444" }}>Bajo</b></span>
        </div>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="loading">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="empty">Sin trabajo registrado en este filtro.</div>
      ) : (
        <table className="grid lb">
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th>Vendedor</th>
              <th className="num">Compl.</th>
              <th className="num">Valid.</th>
              <th className="num">Trabajo</th>
              <th style={{ width: 250 }}>Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const score = puntaje(r.trabajo, objetivo);
              const nv = nivel(score);
              return (
                <tr key={r.vendedor} className={idx === 0 && score > 0 ? "lb-top" : ""}>
                  <td style={{ fontWeight: 700, color: idx === 0 && score > 0 ? "#22c55e" : "var(--muted)" }}>
                    {idx + 1}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{r.vendedor}</span>
                    {r.sucursal && r.sucursal !== "Sin asignar" ? (
                      <span className="muted" style={{ fontSize: 11.5 }}> · {r.sucursal}</span>
                    ) : null}
                  </td>
                  <td className="num" style={{ color: "#06b6d4", fontWeight: 600 }}>{r.completadas}</td>
                  <td className="num" style={{ color: "#22c55e", fontWeight: 700 }}>{r.validados}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{r.trabajo}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20, lineHeight: 1 }}>{nv.icon}</span>
                      <div style={{ minWidth: 66 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: nv.color }}>
                          {score.toFixed(1)}<span className="muted" style={{ fontSize: 11, fontWeight: 400 }}> /10</span>
                        </div>
                        <div style={{ fontSize: 11, color: nv.color, fontWeight: 600 }}>{nv.label}</div>
                      </div>
                      <div className="bartrack" style={{ flex: 1, height: 6 }}>
                        <div className="barfill" style={{ width: `${(score / 10) * 100}%`, background: nv.color }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid var(--line)" }}>
              <td></td>
              <td style={{ fontWeight: 700, color: "var(--muted)" }}>Totales</td>
              <td className="num" style={{ color: "#06b6d4", fontWeight: 700 }}>{t.completadas.toLocaleString("es-AR")}</td>
              <td className="num" style={{ color: "#22c55e", fontWeight: 700 }}>{t.validados.toLocaleString("es-AR")}</td>
              <td className="num" style={{ fontWeight: 700 }}>{t.trabajo.toLocaleString("es-AR")}</td>
              <td className="muted" style={{ fontSize: 11.5 }}>{t.pendientes.toLocaleString("es-AR")} pendientes · {t.paraValidar.toLocaleString("es-AR")} por validar</td>
            </tr>
          </tfoot>
        </table>
      )}
      <div className="muted" style={{ fontSize: 11, marginTop: 12 }}>
        Puntaje = trabajo realizado en el período (fichas completadas + validadas) ÷ objetivo × 10, con tope 10. Sin trabajo = 0. La velocidad (≤7/≤15/≤60 días) se mide aparte en Puntuación. Fechas mock hasta conectar la API del ERP; las aprobaciones que hagas en la app cuentan como trabajo de hoy.
      </div>
    </div>
  );
}
