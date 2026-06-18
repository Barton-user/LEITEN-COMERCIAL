"use client";
import { useEffect, useState, useCallback } from "react";

const PERIODOS = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "Últimos 7 días" },
  { id: "14d", label: "Últimos 14 días" },
  { id: "mes", label: "Este mes" },
  { id: "todo", label: "Todo" },
];

export default function SegSeguimiento({ vendedores }) {
  const [period, setPeriod] = useState("7d");
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
          row = { vendedor: v, sucursal: "", validados: 0, pendientes: 0, paraValidar: 0, omitir: 0 };
          json.porVendedor.push(row);
        }
        row.validados += n;
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
  const top = (data?.porVendedor || []).slice(0, 10);
  const maxV = Math.max(1, ...top.map((r) => r.validados + r.pendientes));

  return (
    <div className="panel-box">
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 2 }}>Seguimiento de segmentación</h3>
          <span className="muted" style={{ fontSize: 12 }}>
            Validaciones por vendedor en el período seleccionado.
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
          <div className="kpi-label" style={{ color: "#22c55e" }}>Validados ({PERIODOS.find((p) => p.id === period).label.toLowerCase()})</div>
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

      {/* Barras */}
      {loading ? (
        <div className="loading">Cargando…</div>
      ) : top.length === 0 ? (
        <div className="empty">Sin validaciones ni pendientes en este filtro.</div>
      ) : (
        <div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 10, display: "flex", gap: 16 }}>
            <span><span style={{ color: "#22c55e" }}>■</span> Validados</span>
            <span><span style={{ color: "#a855f7" }}>■</span> Pendientes de gerencia</span>
          </div>
          {top.map((r) => (
            <div className="barrow" key={r.vendedor}>
              <div className="barlabel" title={r.vendedor}>
                {r.vendedor}
                {r.sucursal && r.sucursal !== "Sin asignar" ? (
                  <small> · {r.sucursal}</small>
                ) : null}
              </div>
              <div className="bartrack">
                <div
                  className="barfill"
                  style={{ width: `${(r.validados / maxV) * 100}%`, background: "#22c55e" }}
                />
                <div
                  className="barfill"
                  style={{ width: `${(r.pendientes / maxV) * 100}%`, background: "#a855f7", borderRadius: 0 }}
                />
              </div>
              <div className="barval">{r.validados}</div>
            </div>
          ))}
        </div>
      )}
      <div className="muted" style={{ fontSize: 11, marginTop: 12 }}>
        Las fechas de validación son simuladas (mock) hasta conectar la API de segmentación del ERP. Las aprobaciones que hagas en la app cuentan como validadas hoy.
      </div>
    </div>
  );
}
