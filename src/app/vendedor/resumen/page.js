import Resumen from "@/components/vendedor/Resumen";
import { getOportunidades } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function ResumenPage() {
  return <Resumen ops={getOportunidades()} />;
}
