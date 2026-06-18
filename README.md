# CRM Comercial · Leiten · Sinis · Barton

Web app (Next.js 14, App Router) con dos vistas de escritorio sobre los datos reales del padrón de clientes:

- **Ciclo de vida del cliente** — indicadores por estado (Prospecto, Cliente nuevo, Activo, En riesgo, Inactivo, Recuperado), filtro por vendedor, búsqueda y generación de acciones (reactivación, recupero, seguimiento) desde cada cliente.
- **Segmentación** — estados de validación de ficha (Para validar, Validación aprobada, Omitir validación), indicadores, filtro por vendedor y aprobación de gerencia.

Modelo basado en el documento *Flujo de Atención Continua · Modelo de Pipeline y Procesos para el CRM* (v2, Junio 2026).

## Datos

`data/clientes.json` — 21.183 clientes deduplicados del export real (`consulta.xlsx`). Se lee en el servidor; el navegador solo recibe agregados y páginas de 50 filas vía `/api/clientes`. La carga inicial del cliente es ~90 KB.

### Cómo se derivó el ciclo de vida (mock)

A partir de las ventas por ventana anual del Excel (`Vta Jun/25–May/26`, `Jun/24–May/25`, `Jun/23–May/24`):

- **Activo** — vendió en los últimos 12 meses.
- **Cliente nuevo** — vendió solo en la ventana más reciente.
- **Recuperado** — vendió en la ventana reciente y en la más vieja, con hueco en el medio.
- **En riesgo** — sin venta en 12 meses, pero sí en 12–24 meses.
- **Inactivo** — sin venta en 24 meses (o sin ventas y no marcado como potencial).
- **Prospecto** — sin ventas y marcado como potencial.

> Es una aproximación: el Excel trae ventas por año, no fechas exactas de última compra. Con fechas reales (o un backend) se calcula según los umbrales exactos del documento (+90 / +180 días).

La segmentación se mapea directo del campo `Estado segmentacion`:
`ValidacionOmitida → Omitir validación`, `ParaValidarSegmentacion → Para validar`, `SegmentacionAprobada → Validación aprobada`.

## Correr local

```bash
npm install
npm run dev      # http://localhost:3000
```

## Deploy en Vercel

1. Subí esta carpeta (`crm-app`) a un repo de GitHub.
2. En Vercel: **New Project** → importá el repo. Framework: **Next.js** (autodetectado). No requiere variables de entorno.
3. Deploy. (`next.config.mjs` ya incluye `data/**` en la función serverless.)

O por CLI:

```bash
npm i -g vercel
vercel
```

## Notas (v1)

- Las acciones generadas y las aprobaciones de segmentación se guardan en `localStorage` del navegador (capa de sesión, para demostrar el flujo). El siguiente paso es persistirlas en una base de datos (ej. Postgres/Supabase en Vercel).
- `empresa` (Leiten/Sinis/Barton) vive a nivel oportunidad, no de cliente, por eso no aparece en estas dos vistas.
