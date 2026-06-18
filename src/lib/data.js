import fs from "fs";
import path from "path";

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

// Seguimiento de segmentación por vendedor, filtrable por período.
export function segSeguimiento({ period = "7d", vendedor = "", sucursal = "" }) {
  let base = getClientes();
  if (vendedor) base = base.filter((c) => c.vendedor === vendedor);
  if (sucursal) base = base.filter((c) => c.sucursal === sucursal);
  const cutoff = cutoffFor(period);

  const map = new Map();
  let totals = { validados: 0, pendientes: 0, paraValidar: 0, omitir: 0 };
  for (const c of base) {
    if (!map.has(c.vendedor))
      map.set(c.vendedor, {
        vendedor: c.vendedor,
        sucursal: c.sucursal,
        validados: 0,
        validadosTotal: 0,
        pendientes: 0,
        paraValidar: 0,
        omitir: 0,
        segSum: 0,
        segN: 0,
      });
    const row = map.get(c.vendedor);
    if (c.segEstado === "Validación aprobada") {
      row.validadosTotal++;
      if (!cutoff || (c.fechaVal && c.fechaVal >= cutoff)) {
        row.validados++;
        totals.validados++;
      }
    } else if (c.segEstado === "Aprobación de gerencia") {
      row.pendientes++;
      totals.pendientes++;
    } else if (c.segEstado === "Para validar") {
      row.paraValidar++;
      totals.paraValidar++;
      row.segSum += ptsParaValidar(c.diasEstado || 0).pts;
      row.segN++;
    } else if (c.segEstado === "Omitir validación") {
      row.omitir++;
      totals.omitir++;
    }
  }

  const porVendedor = [...map.values()]
    .filter((r) => r.validados > 0 || r.pendientes > 0 || r.segN > 0)
    .map((r) => ({
      ...r,
      segScore: r.segN ? +(r.segSum / r.segN).toFixed(1) : null,
    }))
    .sort((a, b) => (b.segScore ?? -1) - (a.segScore ?? -1) || b.validados - a.validados);

  return { period, totals, porVendedor };
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
