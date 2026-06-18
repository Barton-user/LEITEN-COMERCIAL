import PuntuacionView from "@/components/PuntuacionView";
import { puntuacionVendedores } from "@/lib/data";
import { CRITERIOS, VARA_DEFAULT } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function PuntuacionPage() {
  const data = puntuacionVendedores();
  return (
    <PuntuacionView data={data} criterios={CRITERIOS} varaDefault={VARA_DEFAULT} />
  );
}
