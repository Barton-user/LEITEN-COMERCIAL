// Modelo de pipeline del documento (etapas ET + 4 moldes). Client-safe.

export const ET = {
  prospecto:        { key: "prospecto",        nombre: "Prospecto",                       color: "#7c3aed", prob: 10,  cat: "comercial" },
  relevado:         { key: "relevado",         nombre: "Relevado",                        color: "#5e35b1", prob: 20,  cat: "proceso" },
  interes:          { key: "interes",          nombre: "Interés generado",                color: "#0077cc", prob: 35,  cat: "comercial" },
  relev_tec:        { key: "relev_tec",        nombre: "Relevamiento técnico",            color: "#00838f", prob: 45,  cat: "tecnica", ot: true },
  estimativo:       { key: "estimativo",       nombre: "Estimativo presentado",           color: "#00897b", prob: 55,  cat: "tecnica", ot: true },
  desglose:         { key: "desglose",         nombre: "Desglose presentado",             color: "#26a69a", prob: 65,  cat: "tecnica", ot: true, candado: true },
  cotizacion:       { key: "cotizacion",       nombre: "Cotización enviada",              color: "#e91e63", prob: 65,  cat: "proceso", candado: true },
  negociacion:      { key: "negociacion",      nombre: "Negociación iniciada",            color: "#fb8c00", prob: 80,  cat: "comercial" },
  ganada:           { key: "ganada",           nombre: "Ganada",                          color: "#4caf50", prob: 100, cat: "proceso", terminal: true },
  entregado:        { key: "entregado",        nombre: "Entregado",                       color: "#43a047", prob: 100, cat: "proceso" },
};

export const ET_ORDER = [
  "prospecto", "relevado", "interes", "relev_tec", "estimativo",
  "desglose", "cotizacion", "negociacion", "ganada", "entregado",
];

// Los 4 moldes (la empresa hereda del molde)
export const MOLDES = {
  1: { nombre: "Venta estándar",   etapas: ["prospecto", "relevado", "interes", "cotizacion", "negociacion", "ganada", "entregado"] },
  2: { nombre: "Venta con OT",     etapas: ["prospecto", "relevado", "interes", "relev_tec", "estimativo", "desglose", "negociacion", "ganada", "entregado"] },
  3: { nombre: "Alquiler estándar",etapas: ["prospecto", "relevado", "interes", "cotizacion", "negociacion", "ganada", "entregado"] },
  4: { nombre: "Alquiler con OT",  etapas: ["prospecto", "relevado", "interes", "relev_tec", "estimativo", "desglose", "negociacion", "ganada", "entregado"] },
};

export const MARCA_COLOR = { Leiten: "#222222", Sinis: "#C8102E", Barton: "#2e7d32" };

// Molde derivado de empresa + tipo de negocio + ¿Requiere OT? (solo Sinis tiene OT)
export function moldeDe(empresa, tipo, requiereOT) {
  if (tipo === "Alquiler") return empresa === "Sinis" && requiereOT ? 4 : 3;
  return empresa === "Sinis" && requiereOT ? 2 : 1;
}

export function fichaValidada(op) {
  return op.seg_estado === "Validación aprobada";
}

// ¿La etapa tiene candado de segmentación y la ficha no está validada?
export function bloqueadaPorSeg(op) {
  const e = ET[op.estado];
  return !!(e && e.candado && !fichaValidada(op));
}

export function money(v, moneda = "USD") {
  const s = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(v || 0);
  return moneda === "USD" ? `US$ ${s}` : `$ ${s}`;
}
