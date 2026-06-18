import ClientesView from "@/components/ClientesView";
import { getVendedores } from "@/lib/data";
import { CICLO_ESTADOS, CICLO_META } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function CicloVidaPage() {
  const vendedores = getVendedores();
  return (
    <ClientesView
      mode="ciclo"
      campo="ciclo"
      estados={CICLO_ESTADOS}
      meta={CICLO_META}
      vendedores={vendedores}
      title="Ciclo de vida del cliente"
      sub="Indicadores por estado. Filtrá por vendedor, hacé clic en una tarjeta para segmentar la lista y generá una acción desde cada cliente."
    />
  );
}
