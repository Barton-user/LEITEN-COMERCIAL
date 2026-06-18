export function money(n) {
  const v = Number(n) || 0;
  if (v === 0) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(v);
}

export function num(n) {
  return new Intl.NumberFormat("es-AR").format(Number(n) || 0);
}
