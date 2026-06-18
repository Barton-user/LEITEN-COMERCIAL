import { NextResponse } from "next/server";
import { segSeguimiento } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const sp = request.nextUrl.searchParams;
  const result = segSeguimiento({
    vendedor: sp.get("vendedor") || "",
    gerencia: sp.get("gerencia") || "",
  });
  return NextResponse.json(result);
}
