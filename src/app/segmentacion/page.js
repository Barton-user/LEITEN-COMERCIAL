import ClientesView from "@/components/ClientesView";
import { getVendedores } from "@/lib/data";
import { SEG_ESTADOS, SEG_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function SegmentacionPage() {
  const vendedores = getVendedores();
  return (
    <ClientesView
      mode="seg"
      campo="seg"
      estados={SEG_ESTADOS}
      meta={SEG_META}
      vendedores={vendedores}
      title="Segmentación de clientes"
      sub="Validación de los datos maestros de la ficha. “Aprobación de gerencia” lista las fichas completas que esperan al gerente: revisá y aprobá (pasan a Validación aprobada)."
    />
  );
}
