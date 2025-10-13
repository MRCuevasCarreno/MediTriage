// Formatea un RUT chileno a formato XX.XXX.XXX-Y
export function formatRUT(rut: string | number): string {
  let value = String(rut).replace(/[^0-9kK]/g, "").toUpperCase();
  if (!value) return "";
  // Extraer dígito verificador
  let dv = value.slice(-1);
  let num = value.slice(0, -1);
  // Formatear con puntos
  let formatted = "";
  while (num.length > 3) {
    formatted = "." + num.slice(-3) + formatted;
    num = num.slice(0, -3);
  }
  formatted = num + formatted + "-" + dv;
  return formatted;
}
