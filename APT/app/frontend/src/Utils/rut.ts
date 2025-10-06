export function cleanRut(input: string) {
  return (input || "").replace(/[^0-9kK]/g, "").toUpperCase();
}
export function formatRut(input: string) {
  const c = cleanRut(input);
  if (!c) return "";
  const cuerpo = c.slice(0, -1);
  const dv = c.slice(-1);
  const rev = cuerpo.split("").reverse().join("");
  const parts: string[] = [];
  for (let i = 0; i < rev.length; i += 3) parts.push(rev.slice(i, i + 3));
  const cuerpoFmt = parts.join(".").split("").reverse().join("");
  return `${cuerpoFmt}-${dv}`;
}
export function validateRut(input: string) {
  const c = cleanRut(input);
  if (c.length < 2) return false;
  const cuerpo = c.slice(0, -1);
  const dv = c.slice(-1);
  let suma = 0, mul = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (suma % 11);
  const dvCalc = res === 11 ? "0" : res === 10 ? "K" : String(res);
  return dvCalc === dv.toUpperCase();
}
