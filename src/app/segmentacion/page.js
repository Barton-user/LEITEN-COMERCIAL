import ClientesView from "@/components/ClientesView";
import SegSeguimiento from "@/components/SegSeguimiento";
import { getVendedores } from "@/lib/data";
import { SEG_ESTADOS, SEG_META, GERENTES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function SegmentacionPage() {
  const vendedores = getVendedores();
  return (
    <>
      <h2>Segmentación de clientes</h2>
      <p className="sub">
        Validación de los datos maestros de la ficha. “Aprobación de gerencia”
        lista las fichas completas que esperan al gerente: revisá y aprobá (pasan
        a Validación aprobada).
      </p>

      <SegSeguimiento vendedores={vendedores} gerentes={GERENTES} />

      <ClientesView
        mode="seg"
        campo="seg"
        estados={SEG_ESTADOS}
        meta={SEG_META}
        vendedores={vendedores}
        title=""
        sub=""
      />
    </>
  );
}
