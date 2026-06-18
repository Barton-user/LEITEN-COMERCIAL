"use client";
import { useEffect, useState, useCallback } from "react";

const PERIODOS = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "14d", label: "14 días" },
  { id: "mes", label: "Este mes" },
  { id: "todo", label: "Todo" },
];

function scoreColor(v) {
  if (v == null) return "var(--muted)";
  if (v >= 8) return "#22c55e";
  if (v >= 6) return "#f59e0b";
  return "#ef4444";
}

// Medalla según el puntaje promedio (refleja el criterio de antigüedad de "Para validar")
function nivel(v) {
  if (v == null) return { icon: "—", label: "Sin fichas", color: "var(--muted)" };
  if (v >= 8.5) return { icon: "🥇", label: "Muy bueno", color: "#22c55e" };
  if (v >= 6.5) return { icon: "🥈", label: "Bueno", color: "#84cc16" };
  if (v >= 3.5) return { icon: "🥉", label: "Regular", color: "#f59e0b" };
  return { icon: "🚩", label: "Muy malo", color: "#ef4444" };
}

export default function SegSeguimiento({ vendedores }) {
  const [period, setPeriod] = useState("14d");
  const [vendedor, setVendedor] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ period, vendedor });
    const res = await fetch(`/api/seg-seguimiento?${sp.toString()}`);
    const json = await res.json();

    // Sumar aprobaciones hechas en la app (sesión) — cuentan como validadas hoy.
    try {
      let log = JSON.parse(localStorage.getItem("segAprobaciones") || "[]");
      if (vendedor) log = log.filter((a) => a.vendedor === vendedor);
      const byVend = {};
      for (const a of log) byVend[a.vendedor] = (byVend[a.vendedor] || 0) + 1;
      for (const [v, n] of Object.entries(byVend)) {
        json.totals.validados += n;
        json.totals.pendientes = Math.max(0, json.totals.pendientes - n);
        let row = json.porVendedor.find((r) => r.vendedor === v);
        if (!row) {
          row = { vendedor: v, sucursal: "", validados: 0, validadosTotal: 0, pendientes: 0, paraValidar: 0, omitir: 0, segScore: null };
          json.porVendedor.push(row);
        }
        row.validados += n;
        row.validadosTotal += n;
        row.pendientes = Math.max(0, row.pendientes - n);
      }
      json.porVendedor.sort((a, b) => (b.segScore ?? -1) - (a.segScore ?? -1) || b.validados - a.validados);
    } catch (e) {}

    setData(json);
    setLoading(false);
  }, [period, vendedor]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const t = data?.totals || { validados: 0, pendientes: 0, paraValidar: 0, omitir: 0 };
  const rows = (data?.porVendedor || []).slice(0, 12);
  const periodLabel = PERIODOS.find((p) => p.id === period).label.toLowerCase();

  return (
    <div className="panel-box">
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 2 }}>Seguimiento de segmentación</h3>
          <span className="muted" style={{ fontSize: 12 }}>
            Ranking por puntaje de segmentación (fichas “Para validar”) ·{" "}
            <b style={{ color: "#22c55e" }}>{t.validados.toLocaleString("es-AR")} validados</b>{" "}
            ({periodLabel})
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={vendedor} onChange={(e) => setVendedor(e.target.value)}>
            <option value="">Todos los vendedores</option>
            {vendedores.map((v) => (
              <option key={v.vendedor} value={v.vendedor}>
                {v.vendedor}
              </option>
            ))}
          </select>
          <div className="seg-period">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                className={period === p.id ? "active" : ""}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda de medallas */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12, fontSize: 12 }}>
        <span><span style={{ fontSize: 15 }}>🥇</span> <b style={{ color: "#22c55e" }}>Muy bueno</b> <span className="muted">≤ 7 días</span></span>
        <span><span style={{ fontSize: 15 }}>🥈</span> <b style={{ color: "#84cc16" }}>Bueno</b> <span className="muted">≤ 15 días</span></span>
        <span><span style={{ fontSize: 15 }}>🥉</span> <b style={{ color: "#f59e0b" }}>Regular</b> <span className="muted">15 – 60 días</span></span>
        <span><span style={{ fontSize: 15 }}>🚩</span> <b style={{ color: "#ef4444" }}>Muy malo</b> <span className="muted">+2 meses</span></span>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="loading">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="empty">Sin validaciones ni pendientes en este filtro.</div>
      ) : (
        <table className="grid lb">
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th>Vendedor</th>
              <th className="num">Val.</th>
              <th className="num">Pend.</th>
              <th style={{ width: 250 }}>Puntaje segmentación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const score = r.segScore;
              const col = scoreColor(score);
              const nv = nivel(score);
              return (
                <tr key={r.vendedor} className={idx === 0 ? "lb-top" : ""}>
                  <td style={{ fontWeight: 700, color: idx === 0 ? "#22c55e" : "var(--muted)" }}>
                    {idx + 1}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{r.vendedor}</span>
                    {r.sucursal && r.sucursal !== "Sin asignar" ? (
                      <span className="muted" style={{ fontSize: 11.5 }}> · {r.sucursal}</span>
                    ) : null}
                  </td>
                  <td className="num" style={{ color: "#22c55e", fontWeight: 700 }}>{r.validados}</td>
                  <td className="num" style={{ color: "#a855f7", fontWeight: 600 }}>{r.pendientes}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20, lineHeight: 1 }}>{nv.icon}</span>
                      <div style={{ minWidth: 70 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: col }}>
                          {score != null ? score.toFixed(1) : "—"}
                          <span className="muted" style={{ fontSize: 11, fontWeight: 400 }}> /10</span>
                        </div>
                        <div style={{ fontSize: 11, color: nv.color, fontWeight: 600 }}>{nv.label}</div>
                      </div>
                      <div className="bartrack" style={{ flex: 1, height: 6 }}>
                        <div className="barfill" style={{ width: `${((score ?? 0) / 10) * 100}%`, background: col }} />
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
              <td className="num" style={{ color: "#22c55e", fontWeight: 700 }}>
                {t.validados.toLocaleString("es-AR")}
              </td>
              <td className="num" style={{ color: "#a855f7", fontWeight: 700 }}>
                {t.pendientes.toLocaleString("es-AR")}
              </td>
              <td className="muted" style={{ fontSize: 11.5 }}>
                {t.paraValidar.toLocaleString("es-AR")} para validar
              </td>
            </tr>
          </tfoot>
        </table>
      )}
      <div className="muted" style={{ fontSize: 11, marginTop: 12 }}>
        “Puntaje segmentación” = promedio de la antigüedad de las fichas “Para validar” del vendedor (≤7d=10 · ≤15d=8 · ≤60d=5 · +60d=2), el mismo de la pantalla Puntuación. Las fechas son mock hasta conectar la API del ERP; las aprobaciones que hagas en la app cuentan como validadas hoy.
      </div>
    </div>
  );
}
