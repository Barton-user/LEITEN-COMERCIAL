"use client";
import { ET, MOLDES, money, bloqueadaPorSeg } from "@/lib/pipeline";

export default function OpDetail({ op, onClose }) {
  const et = ET[op.estado];
  const lock = bloqueadaPorSeg(op);
  return (
    <div className="mv-sheet-ov" onClick={onClose}>
      <div className="mv-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mv-sheet-hdr" style={{ background: et.color }}>
          <h3>{op.nombre}</h3>
          <div className="cli">{op.cliente} · {op.obra}</div>
        </div>
        <div className="mv-sheet-body">
          {lock && (
            <div className="mv-banner-lock">
              🔒 Bloqueada por segmentación: no se puede avanzar a cotizar hasta validar la ficha del cliente.
            </div>
          )}
          <div className="mv-kv"><span className="k">Etapa</span><span className="v">{et.nombre} · {et.prob}%</span></div>
          <div className="mv-kv"><span className="k">Empresa</span><span className="v">{op.empresa}</span></div>
          <div className="mv-kv"><span className="k">Molde</span><span className="v">{op.molde} · {MOLDES[op.molde]?.nombre}</span></div>
          <div className="mv-kv"><span className="k">Tipo</span><span className="v">{op.tipo}{op.requiereOT ? " · con OT" : ""}</span></div>
          <div className="mv-kv"><span className="k">Valor</span><span className="v">{money(op.valor, op.moneda)}</span></div>
          <div className="mv-kv"><span className="k">Vendedor</span><span className="v">{op.vendedor}</span></div>
          <div className="mv-kv"><span className="k">Sucursal</span><span className="v">{op.sucursal || "—"}</span></div>
          <div className="mv-kv"><span className="k">Contacto</span><span className="v">{op.contacto || "—"}</span></div>
          <div className="mv-kv"><span className="k">Segmentación</span><span className="v">{op.seg_estado}</span></div>
          <div className="mv-kv"><span className="k">Ciclo cliente</span><span className="v">{op.cliente_ciclo}</span></div>
          <div className="mv-kv"><span className="k">Origen</span><span className="v">{op.tipoOrigen}</span></div>
          <div className="mv-kv"><span className="k">Productos</span><span className="v">{(op.productos || []).join(", ") || "—"}</span></div>
          <div className="mv-kv"><span className="k">Próxima acción</span><span className="v">{op.proxAct?.tipo} · {op.proxAct?.fecha}</span></div>
          <button className="mv-close" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
