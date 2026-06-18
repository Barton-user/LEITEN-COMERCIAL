"use client";
import { useState, useMemo } from "react";

const DET = [
  { k: "mb", label: "Muy bueno", color: "#22c55e" },
  { k: "b", label: "Bueno", color: "#84cc16" },
  { k: "r", label: "Regular", color: "#f59e0b" },
  { k: "mm", label: "Muy malo", color: "#ef4444" },
];

export default function PuntuacionView({ data, criterios, varaDefault }) {
  const [vara, setVara] = useState(varaDefault);
  const [sucursal, setSucursal] = useState("");
  const [peoresPrimero, setPeoresPrimero] = useState(false);

  const sucursales = useMemo(
    () =>
      [...new Set(data.map((d) => d.sucursal))]
        .filter((s) => s && s !== "Sin asignar")
        .sort((a, b) => a.localeCompare(b, "es")),
    [data]
  );

  const rows = useMemo(() => {
    let r = sucursal ? data.filter((d) => d.sucursal === sucursal) : [...data];
    r.sort((a, b) =>
      peoresPrimero ? (a.final ?? 99) - (b.final ?? 99) : (b.final ?? 0) - (a.final ?? 0)
    );
    return r;
  }, [data, sucursal, peoresPrimero]);

  const evaluados = rows.length;
  const promedio = evaluados
    ? +(rows.reduce((a, r) => a + (r.final || 0), 0) / evaluados).toFixed(1)
    : 0;
  const complicados = rows.filter((r) => r.final != null && r.final < vara).length;

  function scoreColor(v) {
    if (v == null) return "var(--muted)";
    if (v < vara) return "#ef4444";
    if (v < vara + 1.5) return "#f59e0b";
    return "#22c55e";
  }

  return (
    <div>
      <h2>Puntuación de empleados</h2>
      <p className="sub">
        Puntaje del 1 al 10 por empleado. Por debajo de la vara configurable, el
        empleado queda en situación complicada.
      </p>

      {/* Controles */}
      <div className="toolbar" style={{ alignItems: "center" }}>
        <select value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
          <option value="">Todas las sucursales</option>
          {sucursales.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          className="btn sec sm"
          onClick={() => setPeoresPrimero((v) => !v)}
        >
          {peoresPrimero ? "▲ Peores primero" : "▼ Mejores primero"}
        </button>
        <div className="vara-box">
          <label style={{ margin: 0 }}>Vara</label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={vara}
            onChange={(e) => setVara(parseFloat(e.target.value))}
          />
          <span className="vara-val">{vara.toFixed(1)}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi" style={{ borderTopColor: "#3b82f6", cursor: "default" }}>
          <div className="kpi-label" style={{ color: "#3b82f6" }}>Empleados evaluados</div>
          <div className="kpi-num">{evaluados}</div>
        </div>
        <div className="kpi" style={{ borderTopColor: "#22c55e", cursor: "default" }}>
          <div className="kpi-label" style={{ color: "#22c55e" }}>Promedio general</div>
          <div className="kpi-num">{promedio.toFixed(1)}</div>
        </div>
        <div className="kpi" style={{ borderTopColor: "#ef4444", cursor: "default" }}>
          <div className="kpi-label" style={{ color: "#ef4444" }}>Situación complicada</div>
          <div className="kpi-num">{complicados}</div>
          <div className="kpi-pct">por debajo de {vara.toFixed(1)}</div>
        </div>
      </div>

      {/* Criterios y pesos */}
      <div className="panel-box" style={{ padding: 14, marginBottom: 20 }}>
        <div className="muted" style={{ fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
          Criterios del puntaje (ponderables)
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {criterios.map((c) => (
            <span
              key={c.id}
              className="pill"
              style={{
                opacity: c.activo ? 1 : 0.5,
                borderColor: c.activo ? "#3b82f6" : "var(--line)",
                color: c.activo ? "#e8edf2" : "var(--muted)",
              }}
              title={c.fuente}
            >
              {c.label} · {c.peso}%{c.activo ? "" : " (s/datos)"}
            </span>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <table className="grid">
        <thead>
          <tr>
            <th style={{ width: 36 }}>#</th>
            <th>Empleado</th>
            <th style={{ width: 240 }}>Segmentación <span className="muted">(100%)</span></th>
            <th className="num" style={{ width: 110 }}>Puntaje final</th>
            <th style={{ width: 150 }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const complicada = r.final != null && r.final < vara;
            const total = r.segFichas || 1;
            return (
              <tr key={r.vendedor} className={complicada ? "danger-row" : ""}>
                <td className="muted" style={{ fontWeight: 700 }}>{idx + 1}</td>
                <td>
                  <span style={{ fontWeight: 600 }}>{r.vendedor}</span>
                  {r.sucursal && r.sucursal !== "Sin asignar" ? (
                    <span className="muted" style={{ fontSize: 11.5 }}> · {r.sucursal}</span>
                  ) : null}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: 14 }}>{r.segScore?.toFixed(1) ?? "—"}</b>
                    <div className="bartrack" style={{ flex: 1, height: 8 }}>
                      {DET.map((d) =>
                        r.detalle[d.k] ? (
                          <div
                            key={d.k}
                            className="barfill"
                            style={{
                              width: `${(r.detalle[d.k] / total) * 100}%`,
                              background: d.color,
                              borderRadius: 0,
                            }}
                            title={`${d.label}: ${r.detalle[d.k]}`}
                          />
                        ) : null
                      )}
                    </div>
                    <span className="muted" style={{ fontSize: 11, width: 56, textAlign: "right" }}>
                      {r.segFichas} ficha{r.segFichas === 1 ? "" : "s"}
                    </span>
                  </div>
                </td>
                <td className="num">
                  <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor(r.final) }}>
                    {r.final?.toFixed(1) ?? "—"}
                  </span>
                </td>
                <td>
                  {complicada ? (
                    <span className="pill" style={{ color: "#ef4444", borderColor: "#ef4444" }}>
                      ⚠ Situación complicada
                    </span>
                  ) : (
                    <span className="pill" style={{ color: "#22c55e", borderColor: "#22c55e" }}>
                      OK
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="muted" style={{ fontSize: 11, marginTop: 12 }}>
        Segmentación (vendedor): “Para validar” ≤7 días = 10 · ≤15 = 8 · ≤60 = 5 · +60 = 2. El puntaje del empleado es el promedio de sus fichas. Antigüedades mock hasta conectar la API del ERP. Solo se listan vendedores con fichas pendientes; al sumar más criterios (ventas, actividad, postventa) el puntaje final se recalcula por peso.
      </div>
    </div>
  );
}
