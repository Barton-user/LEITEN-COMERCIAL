"use client";
import { useEffect, useState, useCallback } from "react";

const OBJ_VEND = 35; // fichas trabajadas en 30 días = 10 (vendedor)

function puntaje(trabajo, objetivo) {
  if (!objetivo) return 0;
  return Math.min(10, +((trabajo / objetivo) * 10).toFixed(1));
}

function nivel(v) {
  if (v >= 8.5) return { icon: "🥇", label: "Muy bueno", color: "#22c55e" };
  if (v >= 6.5) return { icon: "🥈", label: "Bueno", color: "#84cc16" };
  if (v >= 3.5) return { icon: "🥉", label: "Regular", color: "#f59e0b" };
  if (v > 0) return { icon: "🚩", label: "Bajo", color: "#ef4444" };
  return { icon: "⛔", label: "Sin trabajo", color: "#ef4444" };
}

function ScoreCell({ score }) {
  const nv = nivel(score);
  return (
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
  );
}

export default function SegSeguimiento({ vendedores, gerentes: gerentesList, gerencia, onGerencia }) {
  const [vendedor, setVendedor] = useState("");
  const [objVend, setObjVend] = useState(OBJ_VEND);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ vendedor, gerencia });
    const res = await fetch(`/api/seg-seguimiento?${sp.toString()}`);
    const json = await res.json();

    try {
      let log = JSON.parse(localStorage.getItem("segAprobaciones") || "[]");
      if (vendedor) log = log.filter((a) => a.vendedor === vendedor);
      const byVend = {};
      for (const a of log) byVend[a.vendedor] = (byVend[a.vendedor] || 0) + 1;
      for (const [v, n] of Object.entries(byVend)) {
        for (const k of ["valHoy", "val7", "val14", "val30", "trabajo30"]) json.totals[k] += n;
        let row = json.porVendedor.find((r) => r.vendedor === v);
        if (!row) {
          row = { vendedor: v, sucursal: "", valHoy: 0, val7: 0, val14: 0, val30: 0, compl30: 0, trabajo30: 0, pendientes: 0 };
          json.porVendedor.push(row);
        }
        for (const k of ["valHoy", "val7", "val14", "val30", "trabajo30"]) row[k] += n;
      }
      json.porVendedor.sort((a, b) => b.trabajo30 - a.trabajo30 || b.val30 - a.val30);
    } catch (e) {}

    setData(json);
    setLoading(false);
  }, [vendedor, gerencia]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const t = data?.totals || { valHoy: 0, val7: 0, val14: 0, val30: 0, trabajo30: 0, pendientes: 0, paraValidar: 0 };
  const rows = (data?.porVendedor || []).slice(0, 12);
  let gerentes = data?.gerentes || [];
  if (gerencia) gerentes = gerentes.filter((g) => g.nombre === gerencia);

  // El selector de vendedores se acota a la gerencia elegida
  const sucsGerencia = gerencia
    ? gerentesList.find((g) => g.nombre === gerencia)?.sucursales || []
    : null;
  const vendedoresOpts = sucsGerencia
    ? vendedores.filter((v) => sucsGerencia.includes(v.sucursal))
    : vendedores;

  return (
    <div className="panel-box">
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 2 }}>Seguimiento de segmentación</h3>
          <span className="muted" style={{ fontSize: 12 }}>
            Validados por ventana de tiempo. Vendedores (completar + validar) y gerentes (validar).
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={gerencia} onChange={(e) => { onGerencia(e.target.value); setVendedor(""); }}>
            <option value="">Todas las gerencias</option>
            {gerentesList.map((g) => (
              <option key={g.nombre} value={g.nombre}>{g.nombre}</option>
            ))}
          </select>
          <select value={vendedor} onChange={(e) => setVendedor(e.target.value)}>
            <option value="">
              {gerencia ? `Vendedores de ${gerencia}` : "Todos los vendedores"}
            </option>
            {vendedoresOpts.map((v) => (
              <option key={v.vendedor} value={v.vendedor}>{v.vendedor}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leyenda medallas */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12, fontSize: 12 }}>
        <span><span style={{ fontSize: 14 }}>🥇</span> <b style={{ color: "#22c55e" }}>Muy bueno</b></span>
        <span><span style={{ fontSize: 14 }}>🥈</span> <b style={{ color: "#84cc16" }}>Bueno</b></span>
        <span><span style={{ fontSize: 14 }}>🥉</span> <b style={{ color: "#f59e0b" }}>Regular</b></span>
        <span><span style={{ fontSize: 14 }}>🚩</span> <b style={{ color: "#ef4444" }}>Bajo</b></span>
      </div>

      {loading ? (
        <div className="loading">Cargando…</div>
      ) : (
        <>
          {/* ── Gerentes ── */}
          <div className="lb-title">Gerentes — al día con sus pendientes (SLA 24/72hs)</div>
          <table className="grid lb" style={{ marginBottom: 22 }}>
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Gerente</th>
                <th className="num">Pend.</th>
                <th className="num">Al día ≤24h</th>
                <th className="num">≤72h</th>
                <th className="num">Atrasados +72h</th>
                <th style={{ width: 230 }}>Puntaje (SLA)</th>
              </tr>
            </thead>
            <tbody>
              {gerentes.map((g, idx) => (
                <tr key={g.nombre} className={idx === 0 && !gerencia ? "lb-top" : ""}>
                  <td style={{ fontWeight: 700, color: "var(--muted)" }}>{idx + 1}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{g.nombre}</span>
                    <span className="muted" style={{ fontSize: 11 }}> · {g.sucursales.filter((s) => !s.startsWith("Gerencia")).join(", ")}</span>
                  </td>
                  <td className="num" style={{ color: "#a855f7", fontWeight: 700 }}>{g.pendientes}</td>
                  <td className="num" style={{ color: "#22c55e", fontWeight: 600 }}>{g.al24}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{g.al72}</td>
                  <td className="num" style={{ color: g.atras ? "#ef4444" : "var(--muted)", fontWeight: 700 }}>{g.atras}</td>
                  <td><ScoreCell score={g.score} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Vendedores ── */}
          <div className="lb-title">
            Vendedores — trabajo realizado{gerencia ? ` · ${gerencia}` : ""}
          </div>
          <div className="vara-box" style={{ display: "inline-flex", marginBottom: 10 }}>
            <label style={{ margin: 0 }}>Objetivo vendedor 30d = 10</label>
            <input
              type="number"
              min="1"
              value={objVend}
              onChange={(e) => setObjVend(Math.max(1, parseInt(e.target.value || "1", 10)))}
              style={{ width: 64 }}
            />
          </div>
          {rows.length === 0 ? (
            <div className="empty">Sin trabajo registrado.</div>
          ) : (
            <table className="grid lb">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Vendedor</th>
                  <th className="num">Hoy</th>
                  <th className="num">7 días</th>
                  <th className="num">14 días</th>
                  <th className="num">30 días</th>
                  <th style={{ width: 230 }}>Puntaje (30d)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const score = puntaje(r.trabajo30, objVend);
                  return (
                    <tr key={r.vendedor} className={idx === 0 && score > 0 ? "lb-top" : ""}>
                      <td style={{ fontWeight: 700, color: idx === 0 && score > 0 ? "#22c55e" : "var(--muted)" }}>{idx + 1}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{r.vendedor}</span>
                        {r.sucursal && r.sucursal !== "Sin asignar" ? (
                          <span className="muted" style={{ fontSize: 11.5 }}> · {r.sucursal}</span>
                        ) : null}
                      </td>
                      <td className="num" style={{ fontWeight: 700, color: r.valHoy ? "#22c55e" : "var(--muted)" }}>{r.valHoy}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{r.val7}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{r.val14}</td>
                      <td className="num" style={{ fontWeight: 600 }}>{r.val30}</td>
                      <td><ScoreCell score={score} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
      <div className="muted" style={{ fontSize: 11, marginTop: 12 }}>
Gerentes: el puntaje mide qué tan al día tienen sus pendientes (≤24h=10 · ≤72h=8 · +72h=3); más backlog viejo, peor puntaje (no premia el volumen). Vendedores: puntaje por trabajo realizado en 30 días (completar + validar) ÷ objetivo × 10. Las columnas Hoy/7/14/30 de vendedores son validaciones por ventana. Fechas mock hasta conectar la API del ERP.
      </div>
    </div>
  );
}
