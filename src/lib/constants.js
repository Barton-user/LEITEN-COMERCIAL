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
export const SEG_ESTADOS = [
  "Para validar",
  "Aprobación de gerencia",
  "Validación aprobada",
  "Omitir validación",
];

export const SEG_META = {
  "Para validar": {
    color: "#f59e0b",
    desc: "Ficha incompleta, propiedad del vendedor. Debe completar los datos maestros antes de pasar a aprobación de gerencia.",
  },
  "Aprobación de gerencia": {
    color: "#a855f7",
    desc: "Ficha completa esperando validación del gerente. Revisá segmento, categoría y contactos clave, y aprobá (pasa a Validación aprobada).",
  },
  "Validación aprobada": {
    color: "#22c55e",
    desc: "El gerente de sucursal confirmó segmento, categoría y contactos clave. Apta para cotizar.",
  },
  "Omitir validación": {
    color: "#64748b",
    desc: "Estado heredado del arranque, en extinción. No es apto para cotizar; debe migrarse a “Para validar”.",
  },
};

// ── Inventario de datos (relevamiento ERP) ──
// estado: "erp" = existe en ERP (generar API) · "parcial" = existe parte · "crear" = no existe
export const DATA_STATUS = {
  erp: { label: "En el ERP", color: "#22c55e", accion: "Generar API" },
  parcial: { label: "Parcial", color: "#f59e0b", accion: "API + crear campos" },
  crear: { label: "A crear", color: "#ef4444", accion: "Crear lista / entidad" },
};

// ── Puntuación de empleados ──
export const VARA_DEFAULT = 6.0;

// Tiempos objetivo de "Para validar" (responsabilidad del vendedor)
export const SEG_TIEMPOS_VENDEDOR = [
  { hasta: 7, label: "Muy bueno", pts: 10, color: "#22c55e" },
  { hasta: 15, label: "Bueno", pts: 8, color: "#84cc16" },
  { hasta: 60, label: "Regular", pts: 5, color: "#f59e0b" },
  { hasta: Infinity, label: "Muy malo", pts: 2, color: "#ef4444" },
];

// Tiempos objetivo de "Pendientes de gerencia" (responsabilidad del gerente) — para etapa futura
export const SEG_TIEMPOS_GERENTE = [
  { hastaHoras: 24, label: "Muy bueno", pts: 10, color: "#22c55e" },
  { hastaHoras: 72, label: "Bueno", pts: 8, color: "#84cc16" },
  { hastaHoras: Infinity, label: "Malo", pts: 3, color: "#ef4444" },
];

// Criterios del puntaje final (ponderables). Hoy solo Segmentación tiene datos.
export const CRITERIOS = [
  { id: "seg", label: "Segmentación", peso: 100, activo: true, fuente: "Antigüedad de fichas “Para validar”" },
  { id: "ventas", label: "Ventas", peso: 0, activo: false, fuente: "Cumplimiento de objetivo (ERP) — próximamente" },
  { id: "actividad", label: "Actividad comercial", peso: 0, activo: false, fuente: "Visitas/llamados/demos — próximamente" },
  { id: "postventa", label: "Postventa", peso: 0, activo: false, fuente: "D+15 / D+30 en fecha — próximamente" },
];

export const DATA_INVENTORY = [
  { lista: "Clientes (padrón maestro)", incluye: "Código, nombre, CUIT, datos fiscales y de contacto", estado: "erp", accion: "Generar API", usadoEn: "Base de toda la app" },
  { lista: "Vendedores", incluye: "Nombre, código y sucursal asignada", estado: "erp", accion: "Generar API", usadoEn: "Filtro por vendedor" },
  { lista: "Sucursales", incluye: "Las 9 sucursales / gerencias", estado: "erp", accion: "Generar API", usadoEn: "Corte de indicadores" },
  { lista: "Segmentos (catálogo)", incluye: "Constructora integral, Proyectista, Contratista de hormigón, etc.", estado: "erp", accion: "Generar API", usadoEn: "Ficha y segmentación" },
  { lista: "Categorías de cliente", incluye: "A+, A, B, C, D", estado: "erp", accion: "Generar API", usadoEn: "Tabla y ficha" },
  { lista: "Estado de segmentación", incluye: "Para validar / Aprobada / Omitir + aprobación de gerencia", estado: "erp", accion: "Generar API (lectura y escritura)", usadoEn: "Vista Segmentación" },
  { lista: "Historial de ventas con fecha", incluye: "Fecha de cada compra/factura por cliente", estado: "erp", accion: "Generar API", usadoEn: "Ciclo de vida exacto (+90/+180 días)" },
  { lista: "Contactos del cliente", incluye: "Personas por cliente: cargo, teléfono, mail", estado: "erp", accion: "Generar API", usadoEn: "Ficha del cliente" },
  { lista: "Productos / líneas", incluye: "Pisón, Plancha, Revocadora, Premezclado…", estado: "erp", accion: "Generar API", usadoEn: "Demos y cotizaciones" },
  { lista: "Obras / proyectos", incluye: "Identificación y ubicación de obra por cliente", estado: "erp", accion: "Generar API", usadoEn: "Oportunidades y visitas" },
  { lista: "Contratos de alquiler", incluye: "Tipo (mensual/quincenal/semanal), fechas, tarifa, vencimiento", estado: "erp", accion: "Generar API", usadoEn: "Ciclo de contrato y recordatorios" },
  { lista: "Cotizaciones", incluye: "N°, fecha, líneas de producto, monto, validez", estado: "erp", accion: "Generar API", usadoEn: "Vista Cotizar (próxima)" },
  { lista: "Usuarios y roles", incluye: "Login y rol: vendedor / gerente / Oficina Técnica", estado: "erp", accion: "Generar API / integrar login", usadoEn: "Permisos y aprobación de gerencia" },
  { lista: "Actividades comerciales", incluye: "Visita a obra, llamado y reunión existen — FALTAN los campos GPS y foto", estado: "parcial", accion: "API para actividades + crear validación GPS y foto", usadoEn: "Registro comercial y métricas de demo" },
  { lista: "Empresa por operación", incluye: "Marcar Leiten / Sinis / Barton en cada operación", estado: "crear", accion: "Crear (depende de Oportunidad)", usadoEn: "Modelo de pipeline (a nivel oportunidad)" },
  { lista: "Oportunidades / pipeline", incluye: "Embudo Prospecto → Ganada: etapa, monto, probabilidad, molde", estado: "crear", accion: "Crear entidad y pipeline (gestionado en la app)", usadoEn: "Vista Pipeline (próxima)" },
];
