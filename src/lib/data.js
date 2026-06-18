import fs from "fs";
import path from "path";
import { GERENTES } from "./constants";

const SUC_A_GERENTE = (() => {
  const m = {};
  for (const g of GERENTES) for (const s of g.sucursales) m[s] = g.nombre;
  return m;
})();

let _cache = null;

// Bucket de segmentación para la vista (combina estado + "ficha completa").
// El monitor de gerencia muestra fichas COMPLETAS y no validadas (doc §4).
function segBucket(c) {
  if (c.seg === "Validación aprobada") return "Validación aprobada";
  if (c.seg === "Omitir validación") return "Omitir validación";
  // c.seg === "Para validar"
  return c.revisado === "Revisado" ? "Aprobación de gerencia" : "Para validar";
}

// Hash determinístico del id → 0..(span-1)
function hashSpan(id, span) {
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % span;
}

export function getClientes() {
  if (_cache) return _cache;
  const file = path.join(process.cwd(), "data", "clientes.json");
  const raw = fs.readFileSync(file, "utf-8");
  const list = JSON.parse(raw);
  for (const c of list) {
    c.segEstado = segBucket(c);
    // Fecha de validación MOCK: las aprobadas se distribuyen en los últimos 90 días.
    // (Reemplazar por la fecha real del ERP cuando exista la API de segmentación.)
    if (c.segEstado === "Validación aprobada") {
      const d = new Date();
      d.setDate(d.getDate() - hashSpan(c.id, 90));
      c.fechaVal = d.toISOString().slice(0, 10);
    }
    // Fecha de COMPLETADO mock (cuando el vendedor sacó la ficha de "Para validar").
    if (c.segEstado === "Aprobación de gerencia" || c.segEstado === "Validación aprobada") {
      const dc = new Date();
      dc.setDate(dc.getDate() - hashSpan(c.id + "c", 90));
      c.fechaCompletado = dc.toISOString().slice(0, 10);
    }
    // Antigüedad MOCK en el estado actual (reemplazar por fecha real del ERP).
    // Distribución sesgada a fichas recientes: ~45% muy bueno, 20% bueno, 25% regular, 10% muy malo.
    if (c.segEstado === "Para validar") {
      const h = hashSpan(c.id, 1000) / 1000;
      let dias;
      if (h < 0.45) dias = Math.floor((h / 0.45) * 7);
      else if (h < 0.65) dias = 8 + Math.floor(((h - 0.45) / 0.2) * 7);
      else if (h < 0.9) dias = 16 + Math.floor(((h - 0.65) / 0.25) * 44);
      else dias = 61 + Math.floor(((h - 0.9) / 0.1) * 89);
      c.diasEstado = dias;
    } else if (c.segEstado === "Aprobación de gerencia") {
      c.horasEstado = hashSpan(c.id, 160); // 0..159 horas
    }
  }
  _cache = list;
  return _cache;
}

function cutoffFor(period) {
  const now = new Date();
  if (period === "hoy") return now.toISOString().slice(0, 10);
  if (period === "mes")
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  const days = period === "7d" ? 7 : period === "14d" ? 14 : null;
  if (days == null) return null; // "todo"
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Seguimiento de segmentación por vendedor: validados por ventana (hoy/7/14/30)
// y trabajo de 30 días (completadas + validadas) para el puntaje.
// También agrega el ranking de gerentes (sus validaciones/aprobaciones por ventana).
export function segSeguimiento({ vendedor = "", gerencia = "" } = {}) {
  const all = getClientes();

  const cutHoy = isoDaysAgo(0);
  const cut7 = isoDaysAgo(6);
  const cut14 = isoDaysAgo(13);
  const cut30 = isoDaysAgo(29);

  // ── Gerentes: puntaje por antigüedad de sus PENDIENTES (SLA 24/72hs), no por volumen ──
  // ≤24h = 10 (al día) · ≤72h = 8 · +72h = 3 (atrasado). 0 pendientes = 10.
  const gmap = new Map();
  for (const g of GERENTES)
    gmap.set(g.nombre, {
      nombre: g.nombre,
      sucursales: g.sucursales,
      pendientes: 0, al24: 0, al72: 0, atras: 0, sumPts: 0,
      val30: 0,
    });
  for (const c of all) {
    const ger = SUC_A_GERENTE[c.sucursal];
    if (!ger) continue;
    const row = gmap.get(ger);
    if (c.segEstado === "Aprobación de gerencia") {
      row.pendientes++;
      const h = c.horasEstado || 0;
      if (h <= 24) { row.al24++; row.sumPts += 10; }
      else if (h <= 72) { row.al72++; row.sumPts += 8; }
      else { row.atras++; row.sumPts += 3; }
    } else if (c.segEstado === "Validación aprobada" && c.fechaVal && c.fechaVal >= cut30) {
      row.val30++;
    }
  }
  const gerentes = [...gmap.values()]
    .map((g) => ({ ...g, score: g.pendientes ? +(g.sumPts / g.pendientes).toFixed(1) : 10 }))
    .sort((a, b) => b.score - a.score || a.atras - b.atras);

  // ── Vendedores (con filtros de vendedor y gerencia) ──
  let base = all;
  if (gerencia) {
    const g = GERENTES.find((x) => x.nombre === gerencia);
    const set = new Set(g ? g.sucursales : []);
    base = base.filter((c) => set.has(c.sucursal));
  }
  if (vendedor) base = base.filter((c) => c.vendedor === vendedor);

  const map = new Map();
  const totals = { valHoy: 0, val7: 0, val14: 0, val30: 0, compl30: 0, trabajo30: 0, pendientes: 0, paraValidar: 0 };
  for (const c of base) {
    if (!map.has(c.vendedor))
      map.set(c.vendedor, {
        vendedor: c.vendedor,
        sucursal: c.sucursal,
        valHoy: 0, val7: 0, val14: 0, val30: 0,
        compl30: 0, trabajo30: 0, pendientes: 0,
      });
    const row = map.get(c.vendedor);
    if (c.segEstado === "Validación aprobada") {
      const f = c.fechaVal;
      if (f) {
        if (f >= cutHoy) { row.valHoy++; totals.valHoy++; }
        if (f >= cut7) { row.val7++; totals.val7++; }
        if (f >= cut14) { row.val14++; totals.val14++; }
        if (f >= cut30) { row.val30++; totals.val30++; }
      }
      if (c.fechaCompletado && c.fechaCompletado >= cut30) { row.compl30++; totals.compl30++; }
    } else if (c.segEstado === "Aprobación de gerencia") {
      row.pendientes++;
      totals.pendientes++;
      if (c.fechaCompletado && c.fechaCompletado >= cut30) { row.compl30++; totals.compl30++; }
    } else if (c.segEstado === "Para validar") {
      totals.paraValidar++;
    }
  }
  for (const r of map.values()) r.trabajo30 = r.compl30 + r.val30;
  totals.trabajo30 = totals.compl30 + totals.val30;

  const porVendedor = [...map.values()]
    .filter((r) => r.trabajo30 > 0 || r.pendientes > 0)
    .sort((a, b) => b.trabajo30 - a.trabajo30 || b.val30 - a.val30);

  return { totals, porVendedor, gerentes };
}

// Puntos de segmentación de una ficha "Para validar" según antigüedad (días).
function ptsParaValidar(dias) {
  if (dias <= 7) return { pts: 10, k: "mb" };
  if (dias <= 15) return { pts: 8, k: "b" };
  if (dias <= 60) return { pts: 5, k: "r" };
  return { pts: 2, k: "mm" };
}

// Puntaje de empleados (vendedores). Hoy el único criterio con datos es Segmentación.
export function puntuacionVendedores() {
  const data = getClientes();
  const map = new Map();
  for (const c of data) {
    if (c.segEstado !== "Para validar") continue;
    if (!map.has(c.vendedor))
      map.set(c.vendedor, {
        vendedor: c.vendedor,
        sucursal: c.sucursal,
        n: 0,
        sum: 0,
        det: { mb: 0, b: 0, r: 0, mm: 0 },
      });
    const row = map.get(c.vendedor);
    const { pts, k } = ptsParaValidar(c.diasEstado || 0);
    row.n++;
    row.sum += pts;
    row.det[k]++;
  }
  return [...map.values()]
    .filter((r) => r.vendedor !== "Marketing" && r.vendedor !== "Sin asignar")
    .map((r) => {
      const seg = r.n ? +(r.sum / r.n).toFixed(1) : null;
      return {
        vendedor: r.vendedor,
        sucursal: r.sucursal,
        segFichas: r.n,
        segScore: seg,
        detalle: r.det,
        final: seg, // único criterio activo hoy
      };
    })
    .sort((a, b) => (b.final ?? 0) - (a.final ?? 0));
}

// Lista de vendedores ordenada con su sucursal
export function getVendedores() {
  const data = getClientes();
  const map = new Map();
  for (const c of data) {
    if (!map.has(c.vendedor)) map.set(c.vendedor, c.sucursal);
  }
  return [...map.entries()]
    .map(([vendedor, sucursal]) => ({ vendedor, sucursal }))
    .sort((a, b) => a.vendedor.localeCompare(b.vendedor, "es"));
}

export function getSucursales() {
  const data = getClientes();
  return [...new Set(data.map((c) => c.sucursal))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

function applyBaseFilters(data, { vendedor, sucursal, q }) {
  let rows = data;
  if (vendedor) rows = rows.filter((c) => c.vendedor === vendedor);
  if (sucursal) rows = rows.filter((c) => c.sucursal === sucursal);
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (c) =>
        (c.nombre || "").toLowerCase().includes(needle) ||
        (c.id || "").toLowerCase().includes(needle) ||
        (c.cuit || "").toLowerCase().includes(needle)
    );
  }
  return rows;
}

// Consulta para una de las dos vistas
export function query({
  campo, // "ciclo" | "seg"
  estado, // valor del estado seleccionado o ""
  vendedor,
  sucursal,
  q,
  page = 0,
  pageSize = 50,
}) {
  const base = applyBaseFilters(getClientes(), { vendedor, sucursal, q });

  // Conteo por estado (sobre el conjunto filtrado, ignorando el estado seleccionado)
  const stats = {};
  for (const c of base) {
    const k = c[campo] || "—";
    stats[k] = (stats[k] || 0) + 1;
  }

  // Filtrado por estado seleccionado para la tabla
  let rows = base;
  if (estado) rows = rows.filter((c) => (c[campo] || "—") === estado);

  const total = rows.length;
  const start = page * pageSize;
  const slice = rows.slice(start, start + pageSize);

  return { stats, total, page, pageSize, rows: slice };
}
