"use client";
import { useState } from "react";
import SegSeguimiento from "@/components/SegSeguimiento";
import ClientesView from "@/components/ClientesView";

export default function SegmentacionView({ vendedores, gerentes, estados, meta }) {
  const [gerencia, setGerencia] = useState("");

  return (
    <>
      <h2>Segmentación de clientes</h2>
      <p className="sub">
        Validación de los datos maestros de la ficha. El filtro de gerencia se
        aplica a todo: seguimiento, gerentes, vendedores y la lista de clientes.
      </p>

      <SegSeguimiento
        vendedores={vendedores}
        gerentes={gerentes}
        gerencia={gerencia}
        onGerencia={setGerencia}
      />

      <ClientesView
        mode="seg"
        campo="seg"
        estados={estados}
        meta={meta}
        vendedores={vendedores}
        gerencia={gerencia}
        title=""
        sub=""
      />
    </>
  );
}
