import { Deuda, PagoDeuda } from "@/types";

function diasEnMes(anio: number, mes: number): number {
  return new Date(anio, mes + 1, 0).getDate();
}

/**
 * Devuelve la fecha de corte del ciclo vigente: el día `diaCorteOPago` del mes
 * actual, o del mes anterior si ese día todavía no ha llegado. Se ajusta
 * (clamp) al último día del mes cuando el mes es más corto que diaCorteOPago
 * (p. ej. corte el 31 en un mes de 30 días).
 */
function ultimoCorte(diaCorteOPago: number, hoy: Date): Date {
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const dia = hoy.getDate();

  const diaCorteEsteMes = Math.min(diaCorteOPago, diasEnMes(anio, mes));
  if (dia >= diaCorteEsteMes) {
    return new Date(anio, mes, diaCorteEsteMes);
  }

  const mesAnterior = mes === 0 ? 11 : mes - 1;
  const anioAnterior = mes === 0 ? anio - 1 : anio;
  const diaCorteMesAnterior = Math.min(diaCorteOPago, diasEnMes(anioAnterior, mesAnterior));
  return new Date(anioAnterior, mesAnterior, diaCorteMesAnterior);
}

function diferenciaDias(a: Date, b: Date): number {
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.round((a.getTime() - b.getTime()) / msPorDia);
}

/**
 * Días en mora de una deuda: si no hay ningún pago registrado desde el
 * último día de corte/pago y ya pasó esa fecha, cuenta los días transcurridos
 * desde entonces. Devuelve 0 si está al día, inactiva o ya saldada.
 */
export function calcularDiasMora(deuda: Deuda, pagos: PagoDeuda[], hoy: Date = new Date()): number {
  if (!deuda.activa || deuda.saldoActual <= 0) return 0;

  const corte = ultimoCorte(deuda.diaCorteOPago, hoy);

  const pagadoDesdeElCorte = pagos.some((p) => {
    if (p.deuda_id !== deuda.id) return false;
    const [anio, mes, dia] = p.fecha.split("-").map(Number);
    return new Date(anio, mes - 1, dia) >= corte;
  });

  if (pagadoDesdeElCorte) return 0;

  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = diferenciaDias(hoySinHora, corte);
  return dias > 0 ? dias : 0;
}
