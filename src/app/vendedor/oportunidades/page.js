import Kanban from "@/components/vendedor/Kanban";
import { getOportunidades } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function OportunidadesPage() {
  const ops = getOportunidades();
  return <Kanban ops={ops} />;
}
