import { DATA_INVENTORY, DATA_STATUS } from "@/lib/constants";

export const metadata = { title: "Data · Inventario de datos" };

const ORDER = { erp: 0, parcial: 1, crear: 2 };

export default function DataPage() {
  const items = [...DATA_INVENTORY].sort(
    (a, b) => ORDER[a.estado] - ORDER[b.estado]
  );
  const counts = items.reduce((acc, it) => {
    acc[it.estado] = (acc[it.estado] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h2>Inventario de datos</h2>
      <p className="sub">
        Listas que la app necesita para enriquecerse. Relevamiento contra el ERP:
        qué existe (generar API) y qué hay que crear.
      </p>

      {/* Resumen */}
      <div className="kpis">
        {Object.entries(DATA_STATUS).map(([key, s]) => (
          <div key={key} className="kpi" style={{ borderTopColor: s.color, cursor: "default" }}>
            <div className="kpi-label" style={{ color: s.color }}>
              {s.label}
            </div>
            <div className="kpi-num">{counts[key] || 0}</div>
            <div className="kpi-pct">{s.accion}</div>
          </div>
        ))}
      </div>

      {/* Matriz */}
      <table className="grid">
        <thead>
          <tr>
            <th style={{ width: "1%" }}>Estado</th>
            <th>Lista de datos</th>
            <th>Qué incluye</th>
            <th>Usada en</th>
            <th>Acción requerida</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const s = DATA_STATUS[it.estado];
            return (
              <tr key={it.lista}>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: s.color,
                    }}
                    title={s.label}
                  />
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{it.lista}</div>
                  <span
                    className="pill"
                    style={{ color: s.color, borderColor: s.color, marginTop: 4 }}
                  >
                    {s.label}
                  </span>
                </td>
                <td className="muted">{it.incluye}</td>
                <td className="muted">{it.usadoEn}</td>
                <td style={{ fontWeight: 500 }}>{it.accion}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Leyenda */}
      <div style={{ marginTop: 18, display: "flex", gap: 18, flexWrap: "wrap" }}>
        {Object.entries(DATA_STATUS).map(([key, s]) => (
          <div key={key} className="muted" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: s.color, display: "inline-block" }} />
            <b style={{ color: s.color, fontWeight: 600 }}>{s.label}</b> — {key === "erp" ? "existe en el ERP, hay que exponerlo vía API" : key === "parcial" ? "existe parte, falta crear campos/datos" : "no existe, hay que crear la lista o entidad"}
          </div>
        ))}
      </div>
    </div>
  );
}
