import Mapa from "@/components/vendedor/Mapa";
import { getOportunidades } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function MapaPage() {
  return <Mapa ops={getOportunidades()} />;
}
