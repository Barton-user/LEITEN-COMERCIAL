"use client";
import { useState, useEffect } from "react";
import { ET, MOLDES, moldeDe } from "@/lib/pipeline";

const EMPRESAS = ["Leiten", "Sinis", "Barton"];

// La segmentación y el origen vienen del ERP al elegir el cliente (acá, de los datos mock).
function segOportunidad(segEstadoCliente) {
  if (segEstadoCliente === "Validación aprobada") return "Validación aprobada";
  if (segEstadoCliente === "Omitir validación") return "Omitir validación";
  return "Para validar"; // "Para validar" o "Aprobación de gerencia"
}
function origenDeCiclo(ciclo) {
  if (ciclo === "Prospecto") return "Nuevo";
  if (ciclo === "En riesgo" || ciclo === "Inactivo") return "Reactivación";
  return "Cliente existente";
}

export default function NuevaOportunidad({ onSave, onClose }) {
  const [f, setF] = useState({
    nombre: "", empresa: "Leiten", tipo: "Venta", requiereOT: false,
    obra: "", contacto: "", valor: "", estado: "prospecto",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  // Cliente: buscador con autocompletado (viene del ERP)
  const [q, setQ] = useState("");
  const [sugs, setSugs] = useState([]);
  const [cli, setCli] = useState(null); // {id,nombre,segEstado,ciclo,vendedor,sucursal}

  useEffect(() => {
    if (cli || q.trim().length < 2) { setSugs([]); return; }
    const t = setTimeout(async () => {
      const sp = new URLSearchParams({ campo: "seg", q: q.trim(), pageSize: "8" });
      const res = await fetch(`/api/clientes?${sp.toString()}`);
      const json = await res.json();
      setSugs(json.rows || []);
    }, 250);
    return () => clearTimeout(t);
  }, [q, cli]);

  const ot = f.empresa === "Sinis" && f.requiereOT;
  const molde = moldeDe(f.empresa, f.tipo, ot);
  const etapas = MOLDES[molde].etapas;
  const valido = f.nombre.trim() && cli;

  const segOpp = cli ? segOportunidad(cli.segEstado) : null;
  const origen = cli ? origenDeCiclo(cli.ciclo) : null;
  const validada = segOpp === "Validación aprobada";

  function guardar() {
    const hoy = new Date();
    const prox = new Date(); prox.setDate(hoy.getDate() + 3);
    onSave({
      id: "n" + Date.now(),
      nombre: f.nombre.trim(),
      empresa: f.empresa, molde, tipo: f.tipo, requiereOT: ot,
      estado: etapas.includes(f.estado) ? f.estado : "prospecto",
      valor: parseInt(f.valor || "0", 10) || 0, moneda: "USD",
      tipoOrigen: origen, tuvoDemo: false,
      cliente: cli.nombre, obra: f.obra.trim(), contacto: f.contacto.trim(),
      vendedor: cli.vendedor || "Juan Garrido", sucursal: cli.sucursal || "",
      cliente_ciclo: cli.ciclo, seg_estado: segOpp,
      productos: [], fechaCreacion: hoy.toISOString().slice(0, 10),
      proxAct: { tipo: "relevamiento", fecha: prox.toISOString().slice(0, 10) },
      _nueva: true,
    });
  }

  return (
    <div className="mv-form-fs">
      <div className="mv-form-bar">
        <button className="bk" onClick={onClose}>‹</button>
        <h2>Nueva oportunidad</h2>
      </div>
      <div className="mv-form-body">
        <div className="mv-fg">
          <label className="mv-fl">Nombre de la oportunidad *</label>
          <input className="mv-fi" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Ej: Vibradores para Edificio Alsina" />
        </div>

        {/* Cliente: viene del ERP */}
        <div className="mv-fg">
          <label className="mv-fl">Cliente * <span style={{ color: "#aaa", fontWeight: 400 }}>(del ERP)</span></label>
          <div className="mv-search">
            <input
              className="mv-fi"
              value={cli ? cli.nombre : q}
              onChange={(e) => { setCli(null); setQ(e.target.value); }}
              placeholder="Buscar cliente por nombre / código…"
            />
            {sugs.length > 0 && (
              <div className="mv-sugs">
                {sugs.map((s) => (
                  <div key={s.id} className="mv-sug" onClick={() => { setCli(s); setSugs([]); setQ(""); }}>
                    <div className="nm">{s.nombre}</div>
                    <div className="meta">{s.id} · {s.segEstado} · {s.ciclo}{s.vendedor ? ` · ${s.vendedor}` : ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Datos automáticos del cliente */}
        {cli && (
          <div className="mv-cli-info">
            <div className="lbl">Datos del cliente (automático, del ERP)</div>
            <div className="row">
              <span>Segmentación</span>
              <span className={"mv-pill " + (validada ? "ok" : segOpp === "Omitir validación" ? "gray" : "no")}>
                {validada ? "✓ Validado" : segOpp === "Omitir validación" ? "Omitir" : "Sin validar"}
              </span>
            </div>
            <div className="row">
              <span>Origen de la oportunidad</span>
              <span className="mv-pill gray">{origen}</span>
            </div>
            {!validada && segOpp !== "Omitir validación" && (
              <div className="auto" style={{ marginTop: 8, color: "#e65100" }}>
                🔒 Ficha sin validar: no podrá avanzar a cotización hasta que Gerencia la valide.
              </div>
            )}
          </div>
        )}

        <div className="mv-fg">
          <label className="mv-fl">Empresa *</label>
          <div className="mv-seg-btns">
            {EMPRESAS.map((e) => (
              <button key={e} className={f.empresa === e ? "on" : ""} onClick={() => set("empresa", e)}>{e}</button>
            ))}
          </div>
        </div>

        <div className="mv-fg">
          <label className="mv-fl">Tipo de negocio</label>
          <div className="mv-seg-btns">
            {["Venta", "Alquiler"].map((t) => (
              <button key={t} className={f.tipo === t ? "on" : ""} onClick={() => set("tipo", t)}>{t}</button>
            ))}
          </div>
        </div>

        {f.empresa === "Sinis" && (
          <div className="mv-fg">
            <div className="mv-toggle-row">
              <span className="lbl">¿Requiere Oficina Técnica? (OT)</span>
              <input type="checkbox" checked={f.requiereOT} onChange={(e) => set("requiereOT", e.target.checked)} style={{ width: 20, height: 20 }} />
            </div>
          </div>
        )}

        <div className="mv-molde-badge">
          Molde {molde} · {MOLDES[molde].nombre} — {etapas.length} pasos
        </div>

        <div className="mv-row2">
          <div className="mv-fg">
            <label className="mv-fl">Obra / proyecto</label>
            <input className="mv-fi" value={f.obra} onChange={(e) => set("obra", e.target.value)} placeholder="Identificación de obra" />
          </div>
          <div className="mv-fg">
            <label className="mv-fl">Contacto</label>
            <input className="mv-fi" value={f.contacto} onChange={(e) => set("contacto", e.target.value)} placeholder="Persona de contacto" />
          </div>
        </div>

        <div className="mv-fg">
          <label className="mv-fl">Valor estimado (USD)</label>
          <input className="mv-fi" type="number" inputMode="numeric" value={f.valor} onChange={(e) => set("valor", e.target.value)} placeholder="0" />
        </div>

        <div className="mv-fg">
          <label className="mv-fl">Etapa inicial</label>
          <select className="mv-fi" value={f.estado} onChange={(e) => set("estado", e.target.value)}>
            {etapas.map((k, i) => <option key={k} value={k}>{i + 1}. {ET[k].nombre}</option>)}
          </select>
        </div>

        <button className="mv-save" disabled={!valido} onClick={guardar}>Crear oportunidad</button>
      </div>
    </div>
  );
}
