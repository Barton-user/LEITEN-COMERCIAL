import { NextResponse } from "next/server";
import { query } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const sp = request.nextUrl.searchParams;
  const campo = sp.get("campo") === "seg" ? "segEstado" : "ciclo";
  const result = query({
    campo,
    estado: sp.get("estado") || "",
    vendedor: sp.get("vendedor") || "",
    sucursal: sp.get("sucursal") || "",
    gerencia: sp.get("gerencia") || "",
    q: sp.get("q") || "",
    page: parseInt(sp.get("page") || "0", 10),
    pageSize: parseInt(sp.get("pageSize") || "50", 10),
  });
  return NextResponse.json(result);
}
