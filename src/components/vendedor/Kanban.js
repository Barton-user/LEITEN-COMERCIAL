"use client";
import { useState, useMemo } from "react";
import { ET, ET_ORDER, MOLDES, MARCA_COLOR, money, bloqueadaPorSeg } from "@/lib/pipeline";

const EMPRESAS = ["Leiten", "Sinis", "Barton"];

function vencInfo(fechaISO) {
  if (!fechaISO) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO + "T00:00:00");
  const dias = Math.round((f - hoy) / 86400000);
  if (dias < 0) return { cls: "exp", txt: `Vencida hace ${-dias}d` };
  if (dias === 0) return { cls: "warn", txt: "Hoy" };
  if (dias <= 3) return { cls: "warn", txt: `En ${dias}d` };
  return { cls: "ok", txt: `En ${dias}d` };
}

export default function Kanban({ ops }) {
  const [empresa, setEmpresa] = useState("");
  const [open, setOpen] = useState(null); // stage key abierto (acordeón simple)
  const [sel, setSel] = useState(null);

  const filtradas = useMemo(
    () => (empresa ? ops.filter((o) => o.empresa === empresa) : ops),
    [ops, empresa]
  );

  const porEtapa = useMemo(() => {
    const m = {};
    for (const k of ET_ORDER) m[k] = [];
    for (const o of filtradas) (m[o.estado] || (m[o.estado] = [])).push(o);
    return m;
  }, [filtradas]);

  const stagesConOps = ET_ORDER.filter((k) => (porEtapa[k] || []).length > 0);
  const openKey = open ?? stagesConOps[0];

  const activas = filtradas.filter((o) => o.estado !== "ganada" && o.estado !== "entregado");
  const valorJuego = activas.reduce((s, o) => s + (o.valor || 0), 0);
  const ganadas = filtradas.filter((o) => o.estado === "ganada").length;

  return (
    <>
      {/* Chips empresa */}
      <div className="mv-toolbar">
        <div className="mv-chips">
          <button className={"mv-chip" + (empresa === "" ? " active" : "")} onClick={() => setEmpresa("")}>Todas</button>
          {EMPRESAS.map((e) => (
            <button
              key={e}
              className={`mv-chip ${e.toLowerCase()}` + (empresa === e ? " active" : "")}
              onClick={() => setEmpresa(empresa === e ? "" : e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen */}
      <div className="mv-summary">
        <div className="mv-sum" style={{ background: "#0077cc" }}>
          <div className="n">{activas.length}</div>
          <div className="l">Activas</div>
        </div>
        <div className="mv-sum" style={{ background: "#7c3aed" }}>
          <div className="n">{money(valorJuego).replace("US$ ", "")}</div>
          <div className="l">Valor en juego</div>
          <div className="v">USD</div>
        </div>
        <div className="mv-sum" style={{ background: "#4caf50" }}>
          <div className="n">{ganadas}</div>
          <div className="l">Ganadas</div>
        </div>
      </div>

      {/* Kanban acordeón */}
      <div className="mv-kanban">
        {stagesConOps.length === 0 && <div className="mv-col-empty">Sin oportunidades.</div>}
        {stagesConOps.map((k) => {
          const et = ET[k];
          const lista = porEtapa[k];
          const isOpen = openKey === k;
          return (
            <div key={k} className={"mv-col" + (isOpen ? " open" : "")}>
              <div className="mv-col-hdr" onClick={() => setOpen(isOpen ? "__none__" : k)}>
                <span className="mv-col-dot" style={{ background: et.color }}>{et.prob}</span>
                <div className="mv-col-title">
                  {et.nombre} <span className="prob">· {et.prob}%</span>
                </div>
                <span className="mv-col-count">{lista.length}</span>
                <span className="mv-col-chevron">›</span>
              </div>
              <div className="mv-col-body">
                {lista.map((o) => {
                  const venc = vencInfo(o.proxAct?.fecha);
                  const lock = bloqueadaPorSeg(o);
                  return (
                    <div
                      key={o.id}
                      className="mv-card"
                      style={{ borderLeftColor: MARCA_COLOR[o.empresa] }}
                      onClick={() => setSel(o)}
                    >
                      <div className="mv-card-r1">
                        <div className="mv-card-name">{o.nombre}</div>
                        <div className="mv-card-valor">{money(o.valor, o.moneda)}</div>
                      </div>
                      <div className="mv-card-sub">{o.cliente} · {o.obra}</div>
                      <div className="mv-card-meta">
                        <span className="mv-marca" style={{ background: MARCA_COLOR[o.empresa] }}>{o.empresa}</span>
                        {o.requiereOT && <span className="mv-tag">OT</span>}
                        {o.tuvoDemo && <span className="mv-tag demo">demo ✓</span>}
                        {lock && <span className="mv-tag lock">🔒 sin validar</span>}
                        {venc && <span className={`mv-venc ${venc.cls}`}>{venc.txt}</span>}
                      </div>
                    </div>
                  );
                })}
                {lista.length === 0 && <div className="mv-col-empty">Vacío</div>}
              </div>
            </div>
          );
        })}
      </div>

      {sel && <DetSheet op={sel} onClose={() => setSel(null)} />}
    </>
  );
}

function DetSheet({ op, onClose }) {
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
          <div className="mv-kv"><span className="k">Sucursal</span><span className="v">{op.sucursal}</span></div>
          <div className="mv-kv"><span className="k">Contacto</span><span className="v">{op.contacto}</span></div>
          <div className="mv-kv"><span className="k">Segmentación</span><span className="v">{op.seg_estado}</span></div>
          <div className="mv-kv"><span className="k">Ciclo cliente</span><span className="v">{op.cliente_ciclo}</span></div>
          <div className="mv-kv"><span className="k">Origen</span><span className="v">{op.tipoOrigen}</span></div>
          <div className="mv-kv"><span className="k">Productos</span><span className="v">{(op.productos || []).join(", ")}</span></div>
          <div className="mv-kv"><span className="k">Próxima acción</span><span className="v">{op.proxAct?.tipo} · {op.proxAct?.fecha}</span></div>
          <button className="mv-close" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
