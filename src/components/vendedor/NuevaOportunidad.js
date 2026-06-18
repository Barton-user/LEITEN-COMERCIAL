"use client";
import { useState } from "react";
import { ET, MOLDES, moldeDe } from "@/lib/pipeline";

const EMPRESAS = ["Leiten", "Sinis", "Barton"];
const ORIGENES = ["Nuevo", "Cliente existente", "Reactivación"];

export default function NuevaOportunidad({ onSave, onClose }) {
  const [f, setF] = useState({
    nombre: "",
    empresa: "Leiten",
    tipo: "Venta",
    requiereOT: false,
    cliente: "",
    obra: "",
    contacto: "",
    valor: "",
    tipoOrigen: "Nuevo",
    estado: "prospecto",
    seg_estado: "Para validar",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const ot = f.empresa === "Sinis" && f.requiereOT;
  const molde = moldeDe(f.empresa, f.tipo, ot);
  const etapas = MOLDES[molde].etapas;
  const valido = f.nombre.trim() && f.cliente.trim();

  function guardar() {
    const hoy = new Date();
    const prox = new Date();
    prox.setDate(hoy.getDate() + 3);
    const op = {
      id: "n" + Date.now(),
      nombre: f.nombre.trim(),
      empresa: f.empresa,
      molde,
      tipo: f.tipo,
      requiereOT: ot,
      estado: etapas.includes(f.estado) ? f.estado : "prospecto",
      valor: parseInt(f.valor || "0", 10) || 0,
      moneda: "USD",
      tipoOrigen: f.tipoOrigen,
      tuvoDemo: false,
      cliente: f.cliente.trim(),
      obra: f.obra.trim(),
      contacto: f.contacto.trim(),
      vendedor: "Juan Garrido",
      sucursal: "",
      cliente_ciclo: f.tipoOrigen === "Nuevo" ? "Prospecto" : "Activo",
      seg_estado: f.seg_estado,
      productos: [],
      fechaCreacion: hoy.toISOString().slice(0, 10),
      proxAct: { tipo: "relevamiento", fecha: prox.toISOString().slice(0, 10) },
      _nueva: true,
    };
    onSave(op);
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

        <div className="mv-fg">
          <label className="mv-fl">Cliente *</label>
          <input className="mv-fi" value={f.cliente} onChange={(e) => set("cliente", e.target.value)} placeholder="Nombre / razón social" />
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

        <div className="mv-row2">
          <div className="mv-fg">
            <label className="mv-fl">Valor estimado (USD)</label>
            <input className="mv-fi" type="number" inputMode="numeric" value={f.valor} onChange={(e) => set("valor", e.target.value)} placeholder="0" />
          </div>
          <div className="mv-fg">
            <label className="mv-fl">Origen</label>
            <select className="mv-fi" value={f.tipoOrigen} onChange={(e) => set("tipoOrigen", e.target.value)}>
              {ORIGENES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="mv-fg">
          <label className="mv-fl">Etapa inicial</label>
          <select className="mv-fi" value={f.estado} onChange={(e) => set("estado", e.target.value)}>
            {etapas.map((k, i) => <option key={k} value={k}>{i + 1}. {ET[k].nombre}</option>)}
          </select>
        </div>

        <div className="mv-fg">
          <label className="mv-fl">Estado de segmentación del cliente</label>
          <select className="mv-fi" value={f.seg_estado} onChange={(e) => set("seg_estado", e.target.value)}>
            <option>Para validar</option>
            <option>Validación aprobada</option>
            <option>Omitir validación</option>
          </select>
        </div>

        <button className="mv-save" disabled={!valido} onClick={guardar}>Crear oportunidad</button>
      </div>
    </div>
  );
}
