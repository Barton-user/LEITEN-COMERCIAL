"use client";
import { useEffect, useState, useCallback } from "react";

const PERIODOS = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "14d", label: "14 días" },
  { id: "mes", label: "Este mes" },
  { id: "todo", label: "Todo" },
];

function avanceColor(pct) {
  if (pct >= 70) return "#22c55e";
  if (pct >= 55) return "#f59e0b";
  return "#ef4444";
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
          row = { vendedor: v, sucursal: "", validados: 0, validadosTotal: 0, pendientes: 0, paraValidar: 0, omitir: 0 };
          json.porVendedor.push(row);
        }
        row.validados += n;
        row.validadosTotal += n;
        row.pendientes = Math.max(0, row.pendientes - n);
      }
      json.porVendedor.sort((a, b) => b.validados - a.validados || b.pendientes - a.pendientes);
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
            Ranking de vendedores por validaciones en el período.
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

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi" style={{ borderTopColor: "#22c55e", cursor: "default" }}>
          <div className="kpi-label" style={{ color: "#22c55e" }}>Validados ({periodLabel})</div>
          <div className="kpi-num">{t.validados.toLocaleString("es-AR")}</div>
        </div>
        <div className="kpi" style={{ borderTopColor: "#a855f7", cursor: "default" }}>
          <div className="kpi-label" style={{ color: "#a855f7" }}>Pendientes de gerencia</div>
          <div className="kpi-num">{t.pendientes.toLocaleString("es-AR")}</div>
        </div>
        <div className="kpi" style={{ borderTopColor: "#f59e0b", cursor: "default" }}>
          <div className="kpi-label" style={{ color: "#f59e0b" }}>Para validar</div>
          <div className="kpi-num">{t.paraValidar.toLocaleString("es-AR")}</div>
        </div>
        <div className="kpi" style={{ borderTopColor: "#64748b", cursor: "default" }}>
          <div className="kpi-label" style={{ color: "#64748b" }}>Omitir validación</div>
          <div className="kpi-num">{t.omitir.toLocaleString("es-AR")}</div>
        </div>
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
              <th style={{ width: 200 }}>Avance de cartera</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const denom = r.validadosTotal + r.pendientes + r.paraValidar;
              const pct = denom ? Math.round((r.validadosTotal / denom) * 100) : 0;
              const col = avanceColor(pct);
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="bartrack" style={{ flex: 1, height: 8 }}>
                        <div className="barfill" style={{ width: `${pct}%`, background: col }} />
                      </div>
                      <span className="muted" style={{ fontSize: 11.5, width: 34, textAlign: "right" }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="muted" style={{ fontSize: 11, marginTop: 12 }}>
        “Avance de cartera” = fichas validadas sobre el total a gestionar del vendedor. Las fechas de validación son mock hasta conectar la API del ERP; las aprobaciones que hagas en la app cuentan como validadas hoy.
      </div>
    </div>
  );
}
