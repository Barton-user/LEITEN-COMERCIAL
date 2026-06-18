"use client";
import { useEffect, useState, useCallback } from "react";
import { money } from "@/lib/format";

const PAGE_SIZE = 50;

export default function ClientesView({
  campo, // "ciclo" | "seg"
  estados, // array de estados en orden
  meta, // { estado: { color, desc, accion? } }
  vendedores, // [{vendedor, sucursal}]
  title,
  sub,
  mode, // "ciclo" | "seg"
}) {
  const [estado, setEstado] = useState("");
  const [vendedor, setVendedor] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const [data, setData] = useState({ stats: {}, total: 0, rows: [] });
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null); // cliente en el drawer
  const [toast, setToast] = useState("");

  // overrides de sesión (localStorage)
  const [segOverrides, setSegOverrides] = useState({});
  const [acciones, setAcciones] = useState([]);

  useEffect(() => {
    try {
      setSegOverrides(JSON.parse(localStorage.getItem("segOverrides") || "{}"));
      setAcciones(JSON.parse(localStorage.getItem("accionesLog") || "[]"));
    } catch (e) {}
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({
      campo,
      estado,
      vendedor,
      q,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    const res = await fetch(`/api/clientes?${sp.toString()}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [campo, estado, vendedor, q, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // debounce de búsqueda
  const [qInput, setQInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }

  function segDe(c) {
    return segOverrides[c.id] || c.segEstado;
  }

  function aprobarSegmentacion(c) {
    const next = { ...segOverrides, [c.id]: "Validación aprobada" };
    setSegOverrides(next);
    localStorage.setItem("segOverrides", JSON.stringify(next));
    // Log para el indicador de seguimiento (cuenta como validado hoy)
    try {
      const log = JSON.parse(localStorage.getItem("segAprobaciones") || "[]");
      if (!log.some((a) => a.id === c.id)) {
        log.push({
          id: c.id,
          vendedor: c.vendedor,
          sucursal: c.sucursal,
          fecha: new Date().toISOString().slice(0, 10),
        });
        localStorage.setItem("segAprobaciones", JSON.stringify(log));
      }
    } catch (e) {}
    showToast(`Segmentación aprobada · ${c.nombre}`);
    setSel(null);
  }

  function enviarAValidar(c) {
    const next = { ...segOverrides, [c.id]: "Para validar" };
    setSegOverrides(next);
    localStorage.setItem("segOverrides", JSON.stringify(next));
    showToast(`Enviado a “Para validar” · ${c.nombre}`);
    setSel(null);
  }

  function generarAccion(c, tipo) {
    const reg = {
      id: c.id,
      nombre: c.nombre,
      tipo,
      vendedor: c.vendedor,
      fecha: new Date().toISOString().slice(0, 10),
    };
    const next = [reg, ...acciones];
    setAcciones(next);
    localStorage.setItem("accionesLog", JSON.stringify(next));
    showToast(`${tipo} generada · ${c.nombre}`);
    setSel(null);
  }

  const totalFiltrado = Object.values(data.stats).reduce((a, b) => a + b, 0);
  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  return (
    <div>
      <div className="row-between">
        <div>
          {title ? <h2>{title}</h2> : null}
          {sub ? <p className="sub">{sub}</p> : null}
        </div>
        {mode === "seg" && acciones.length >= 0 && (
          <div className="muted" style={{ fontSize: 12 }}>
            {Object.keys(segOverrides).length > 0 &&
              `${Object.keys(segOverrides).length} ficha(s) modificadas en esta sesión`}
          </div>
        )}
        {mode === "ciclo" && acciones.length > 0 && (
          <div className="muted" style={{ fontSize: 12 }}>
            {acciones.length} acción(es) generadas en esta sesión
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="toolbar">
        <select
          value={vendedor}
          onChange={(e) => {
            setVendedor(e.target.value);
            setPage(0);
          }}
          style={{ minWidth: 240 }}
        >
          <option value="">Todos los vendedores</option>
          {vendedores.map((v) => (
            <option key={v.vendedor} value={v.vendedor}>
              {v.vendedor}
              {v.sucursal && v.sucursal !== "Sin asignar"
                ? ` · ${v.sucursal}`
                : ""}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Buscar cliente / código / CUIT…"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          style={{ minWidth: 240 }}
        />
        {estado && (
          <button className="btn sec sm" onClick={() => setEstado("")}>
            ✕ Quitar filtro: {estado}
          </button>
        )}
      </div>

      {/* KPIs por estado */}
      <div className="kpis">
        {estados.map((est) => {
          const n = data.stats[est] || 0;
          const pct = totalFiltrado ? Math.round((n / totalFiltrado) * 100) : 0;
          const color = meta[est]?.color || "#3b82f6";
          return (
            <div
              key={est}
              className={"kpi" + (estado === est ? " active" : "")}
              style={{ borderTopColor: color }}
              onClick={() => {
                setEstado(estado === est ? "" : est);
                setPage(0);
              }}
              title={meta[est]?.desc || ""}
            >
              <div className="kpi-label" style={{ color }}>
                {est}
              </div>
              <div className="kpi-num">{n.toLocaleString("es-AR")}</div>
              <div className="kpi-pct">{pct}% del filtro</div>
            </div>
          );
        })}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="loading">Cargando…</div>
      ) : data.rows.length === 0 ? (
        <div className="empty">Sin clientes para este filtro.</div>
      ) : (
        <>
          <table className="grid">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Sucursal</th>
                <th>{mode === "seg" ? "Segmentación" : "Ciclo de vida"}</th>
                <th>Categoría</th>
                <th className="num">Vta 12m</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((c) => {
                const estVal = mode === "seg" ? segDe(c) : c.ciclo;
                const color = meta[estVal]?.color || "#64748b";
                const overridden =
                  mode === "seg" &&
                  segOverrides[c.id] &&
                  segOverrides[c.id] !== c.segEstado;
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>
                        {c.id} {c.cuit ? `· ${c.cuit}` : ""}
                      </div>
                    </td>
                    <td>{c.vendedor}</td>
                    <td className="muted">{c.sucursal}</td>
                    <td>
                      <span
                        className="pill"
                        style={{ color, borderColor: color }}
                      >
                        {estVal}
                      </span>
                      {overridden && (
                        <span
                          className="muted"
                          style={{ fontSize: 10, marginLeft: 6 }}
                        >
                          (sesión)
                        </span>
                      )}
                    </td>
                    <td>{c.categoria}</td>
                    <td className="num">{money(c.y1)}</td>
                    <td>
                      <button className="btn sec sm" onClick={() => setSel(c)}>
                        {mode === "seg" ? "Revisar" : "Acción"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="pager">
            <span className="muted">
              {data.total.toLocaleString("es-AR")} clientes
              {estado ? ` en “${estado}”` : ""} · página {page + 1} de{" "}
              {totalPages || 1}
            </span>
            <button
              className="btn sec sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Anterior
            </button>
            <button
              className="btn sec sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}

      {/* Drawer */}
      {sel && (
        <Drawer
          c={sel}
          mode={mode}
          meta={meta}
          segActual={mode === "seg" ? segDe(sel) : sel.ciclo}
          onClose={() => setSel(null)}
          onAprobar={() => aprobarSegmentacion(sel)}
          onEnviarValidar={() => enviarAValidar(sel)}
          onAccion={(tipo) => generarAccion(sel, tipo)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Drawer({
  c,
  mode,
  meta,
  segActual,
  onClose,
  onAprobar,
  onEnviarValidar,
  onAccion,
}) {
  const estVal = mode === "seg" ? segActual : c.ciclo;
  const m = meta[estVal] || {};
  return (
    <div className="overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="row-between">
          <h3>{c.nombre}</h3>
          <button className="btn sec sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
          {c.id} {c.cuit ? `· ${c.cuit}` : ""}
        </p>

        <div
          className="pill"
          style={{
            color: m.color,
            borderColor: m.color,
            marginBottom: 8,
          }}
        >
          {estVal}
        </div>
        {m.desc && (
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 16 }}>
            {m.desc}
          </p>
        )}

        <div className="kv">
          <span className="k">Vendedor</span>
          <span>{c.vendedor}</span>
        </div>
        <div className="kv">
          <span className="k">Sucursal</span>
          <span>{c.sucursal}</span>
        </div>
        <div className="kv">
          <span className="k">Segmento</span>
          <span>{c.segmento}</span>
        </div>
        <div className="kv">
          <span className="k">Categoría</span>
          <span>{c.categoria}</span>
        </div>
        <div className="kv">
          <span className="k">Provincia</span>
          <span>{c.provincia || "—"}</span>
        </div>
        <div className="kv">
          <span className="k">Mail</span>
          <span>{c.mail || "—"}</span>
        </div>
        <div className="kv">
          <span className="k">Teléfono</span>
          <span>{c.tel || "—"}</span>
        </div>
        <div className="kv">
          <span className="k">Vta últimos 12m</span>
          <span>{money(c.y1)}</span>
        </div>
        <div className="kv">
          <span className="k">Vta 12–24m</span>
          <span>{money(c.y2)}</span>
        </div>
        <div className="kv">
          <span className="k">Vta 24–36m</span>
          <span>{money(c.y3)}</span>
        </div>

        <div className="drawer-actions">
          {mode === "seg" ? (
            <>
              {segActual === "Validación aprobada" && (
                <div className="muted" style={{ fontSize: 13 }}>
                  Ficha ya validada por gerencia. Apta para cotizar.
                </div>
              )}
              {segActual === "Aprobación de gerencia" && (
                <button className="btn" onClick={onAprobar}>
                  ✓ Aprobar segmentación (Gerencia)
                </button>
              )}
              {segActual === "Para validar" && (
                <div className="muted" style={{ fontSize: 13 }}>
                  Ficha incompleta, pendiente del vendedor. No apta para aprobar
                  hasta que esté completa.
                </div>
              )}
              {segActual === "Omitir validación" && (
                <button className="btn sec" onClick={onEnviarValidar}>
                  Migrar a “Para validar”
                </button>
              )}
            </>
          ) : (
            <>
              {m.accion && (
                <button className="btn" onClick={() => onAccion(m.accion.tipo)}>
                  {m.accion.label}
                </button>
              )}
              <button
                className="btn sec"
                onClick={() => onAccion("Llamado de seguimiento")}
              >
                Registrar llamado de seguimiento
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
