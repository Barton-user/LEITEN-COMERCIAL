import fs from "fs";
import path from "path";

let _cache = null;

export function getClientes() {
  if (_cache) return _cache;
  const file = path.join(process.cwd(), "data", "clientes.json");
  const raw = fs.readFileSync(file, "utf-8");
  _cache = JSON.parse(raw);
  return _cache;
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
