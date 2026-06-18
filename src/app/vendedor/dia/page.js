import MiDia from "@/components/vendedor/MiDia";
import { getOportunidades } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function DiaPage() {
  return <MiDia ops={getOportunidades()} />;
}
