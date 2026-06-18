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

// ── Inventario de datos (relevamiento ERP) ──
// estado: "erp" = existe en ERP (generar API) · "parcial" = existe parte · "crear" = no existe
export const DATA_STATUS = {
  erp: { label: "En el ERP", color: "#22c55e", accion: "Generar API" },
  parcial: { label: "Parcial", color: "#f59e0b", accion: "API + crear campos" },
  crear: { label: "A crear", color: "#ef4444", accion: "Crear lista / entidad" },
};

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
