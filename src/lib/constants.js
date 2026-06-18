// Modelo del documento "Flujo de Atención Continua" (v2, Jun 2026)

// Ciclo de vida del cliente (Sección 3)
export const CICLO_ESTADOS = [
  "Prospecto",
  "Cliente nuevo",
  "Activo",
  "En riesgo",
  "Inactivo",
  "Recuperado",
];

export const CICLO_META = {
  "Prospecto": {
    color: "#64748b",
    desc: "Aún no cerró ningún negocio. Hay que detectarlo, relevarlo y validar su ficha.",
    accion: { label: "Asignar relevamiento", tipo: "Relevamiento" },
  },
  "Cliente nuevo": {
    color: "#06b6d4",
    desc: "Tuvo su primer cierre ganado. Pasa a Activo al cierre del mes calendario.",
    accion: { label: "Programar bienvenida", tipo: "Postventa" },
  },
  "Activo": {
    color: "#22c55e",
    desc: "Compró dentro de los últimos 12 meses. Relación comercial vigente.",
    accion: { label: "Registrar seguimiento", tipo: "Seguimiento" },
  },
  "En riesgo": {
    color: "#f59e0b",
    desc: "Sin compra hace +90 días. Dispara reactivación automática (contacto en 7 días).",
    accion: { label: "Generar reactivación", tipo: "Reactivación" },
  },
  "Inactivo": {
    color: "#ef4444",
    desc: "Sin compra hace +180 días. Alerta a gerencia + tarea de recupero.",
    accion: { label: "Generar recupero", tipo: "Recupero" },
  },
  "Recuperado": {
    color: "#a855f7",
    desc: "Volvió a comprar tras estar en riesgo o inactivo. Luego retorna a Activo.",
    accion: { label: "Registrar seguimiento", tipo: "Seguimiento" },
  },
};

// Estado de segmentación (Sección 4)
export const SEG_ESTADOS = ["Para validar", "Validación aprobada", "Omitir validación"];

export const SEG_META = {
  "Para validar": {
    color: "#f59e0b",
    desc: "Estado de entrada, propiedad del vendedor. La ficha espera validación de gerencia.",
  },
  "Validación aprobada": {
    color: "#22c55e",
    desc: "El gerente de sucursal confirmó segmento, categoría y contactos clave.",
  },
  "Omitir validación": {
    color: "#64748b",
    desc: "Estado heredado del arranque, en extinción. No es apto para cotizar; debe migrarse a “Para validar”.",
  },
};
