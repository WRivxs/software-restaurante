export function calcularCambio(total, pagado) {
  return Math.max(0, pagado - total);
}
