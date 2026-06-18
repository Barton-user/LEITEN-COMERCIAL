import SegmentacionView from "@/components/SegmentacionView";
import { getVendedores } from "@/lib/data";
import { SEG_ESTADOS, SEG_META, GERENTES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function SegmentacionPage() {
  const vendedores = getVendedores();
  return (
    <SegmentacionView
      vendedores={vendedores}
      gerentes={GERENTES}
      estados={SEG_ESTADOS}
      meta={SEG_META}
    />
  );
}
