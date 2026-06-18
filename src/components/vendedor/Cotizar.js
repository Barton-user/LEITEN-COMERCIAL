"use client";
import { useState, useEffect } from "react";

const EMPRESAS = ["Leiten", "Sinis", "Barton"];

function fmt(n, moneda) {
  const s = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(n || 0));
  return (moneda === "USD" ? "US$ " : "$ ") + s;
}

export default function Cotizar() {
  const [empresa, setEmpresa] = useState("Leiten");
  const [moneda, setMoneda] = useState("USD");
  const [desc, setDesc] = useState(0);
  const [iva, setIva] = useState(21);
  const [lineas, setLineas] = useState([{ d: "", c: 1, p: "" }]);
  const [emitida, setEmitida] = useState(false);

  // Cliente (ERP)
  const [q, setQ] = useState("");
  const [sugs, setSugs] = useState([]);
  const [cli, setCli] = useState(null);
  useEffect(() => {
    if (cli || q.trim().length < 2) { setSugs([]); return; }
    const t = setTimeout(async () => {
      const sp = new URLSearchParams({ campo: "seg", q: q.trim(), pageSize: "8" });
      const r = await fetch(`/api/clientes?${sp.toString()}`);
      setSugs((await r.json()).rows || []);
    }, 250);
    return () => clearTimeout(t);
  }, [q, cli]);

  const setLin = (i, k, v) => setLineas((p) => p.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
  const addLin = () => setLineas((p) => [...p, { d: "", c: 1, p: "" }]);
  const delLin = (i) => setLineas((p) => p.filter((_, idx) => idx !== i));

  const subtotal = lineas.reduce((s, l) => s + (parseFloat(l.c) || 0) * (parseFloat(l.p) || 0), 0);
  const descMonto = subtotal * (desc / 100);
  const baseIva = subtotal - descMonto;
  const ivaMonto = baseIva * (iva / 100);
  const total = baseIva + ivaMonto;
  const valido = cli && lineas.some((l) => l.d.trim() && parseFloat(l.p) > 0);

  if (emitida) {
    return (
      <div>
        <div className="mv-screen-t">Cotización generada</div>
        <div style={{ padding: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, color: "#888" }}>{empresa} · {cli.nombre}</div>
            <div style={{ fontSize: 26, fontWeight: 800, margin: "8px 0" }}>{fmt(total, moneda)}</div>
            {lineas.filter((l) => l.d.trim()).map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid #f2f2f2" }}>
                <span>{l.c}× {l.d}</span><span>{fmt((parseFloat(l.c) || 0) * (parseFloat(l.p) || 0), moneda)}</span>
              </div>
            ))}
            <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>Descuento {desc}% · IVA {iva}%</div>
          </div>
          <div className="mv-banner-lock" style={{ marginTop: 14 }}>
            El envío automático por mail/WhatsApp y el PDF se habilitan al conectar el ERP y jsPDF.
          </div>
          <button className="mv-save" style={{ marginTop: 8 }} onClick={() => { setEmitida(false); setLineas([{ d: "", c: 1, p: "" }]); setCli(null); }}>Nueva cotización</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mv-screen-t">Cotizar</div>
      <div className="mv-screen-s">Cliente, productos y totales.</div>
      <div style={{ padding: 16 }}>
        <div className="mv-fg">
          <label className="mv-fl">Empresa que cotiza</label>
          <div className="mv-seg-btns">
            {EMPRESAS.map((e) => <button key={e} className={empresa === e ? "on" : ""} onClick={() => setEmpresa(e)}>{e}</button>)}
          </div>
        </div>

        <div className="mv-fg">
          <label className="mv-fl">Cliente * <span style={{ color: "#aaa", fontWeight: 400 }}>(del ERP)</span></label>
          <div className="mv-search">
            <input className="mv-fi" value={cli ? cli.nombre : q} onChange={(e) => { setCli(null); setQ(e.target.value); }} placeholder="Buscar cliente…" />
            {sugs.length > 0 && (
              <div className="mv-sugs">
                {sugs.map((s) => (
                  <div key={s.id} className="mv-sug" onClick={() => { setCli(s); setSugs([]); setQ(""); }}>
                    <div className="nm">{s.nombre}</div>
                    <div className="meta">{s.id} · {s.segEstado}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <label className="mv-fl">Líneas de la cotización</label>
        {lineas.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
            <input className="mv-fi" style={{ flex: 2 }} placeholder="Producto" value={l.d} onChange={(e) => setLin(i, "d", e.target.value)} />
            <input className="mv-fi" style={{ width: 48, textAlign: "center" }} type="number" value={l.c} onChange={(e) => setLin(i, "c", e.target.value)} />
            <input className="mv-fi" style={{ width: 80 }} type="number" placeholder="P.unit" value={l.p} onChange={(e) => setLin(i, "p", e.target.value)} />
            {lineas.length > 1 && <button onClick={() => delLin(i)} style={{ border: "none", background: "none", color: "#c62828", fontSize: 20, cursor: "pointer" }}>×</button>}
          </div>
        ))}
        <button onClick={addLin} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 14 }}>+ Agregar línea</button>

        <div className="mv-row2">
          <div className="mv-fg"><label className="mv-fl">Descuento (%)</label><input className="mv-fi" type="number" value={desc} onChange={(e) => setDesc(parseFloat(e.target.value) || 0)} /></div>
          <div className="mv-fg"><label className="mv-fl">IVA (%)</label><input className="mv-fi" type="number" value={iva} onChange={(e) => setIva(parseFloat(e.target.value) || 0)} /></div>
          <div className="mv-fg"><label className="mv-fl">Moneda</label>
            <select className="mv-fi" value={moneda} onChange={(e) => setMoneda(e.target.value)}><option>USD</option><option>ARS</option></select>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>Subtotal</span><span>{fmt(subtotal, moneda)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0", color: "#c62828" }}><span>Descuento</span><span>− {fmt(descMonto, moneda)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>IVA {iva}%</span><span>{fmt(ivaMonto, moneda)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, marginTop: 6, paddingTop: 8, borderTop: "1px solid #eee" }}><span>Total</span><span>{fmt(total, moneda)}</span></div>
        </div>

        <button className="mv-save" disabled={!valido} onClick={() => setEmitida(true)}>Generar cotización</button>
      </div>
    </div>
  );
}
