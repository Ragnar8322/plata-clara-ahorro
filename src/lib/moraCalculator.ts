import { Deuda, PagoDeuda } from "@/types";
import { diasEnMes } from "@/lib/fechas";

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

/**
 * Corte inmediatamente anterior a `corte`, es decir el inicio del ciclo que ese corte cierra.
 */
function corteAnterior(diaCorteOPago: number, corte: Date): Date {
  const mes = corte.getMonth() === 0 ? 11 : corte.getMonth() - 1;
  const anio = corte.getMonth() === 0 ? corte.getFullYear() - 1 : corte.getFullYear();
  return new Date(anio, mes, Math.min(diaCorteOPago, diasEnMes(anio, mes)));
}

function diferenciaDias(a: Date, b: Date): number {
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.round((a.getTime() - b.getTime()) / msPorDia);
}

function formatFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Fecha (YYYY-MM-DD) del último corte vigente de una deuda. Útil para
 * reconocer manualmente un ciclo como cubierto sin registrar un pago.
 */
export function fechaUltimoCorte(deuda: Deuda, hoy: Date = new Date()): string {
  return formatFecha(ultimoCorte(deuda.diaCorteOPago, hoy));
}

/**
 * Días en mora de una deuda: si no hay ningún pago registrado ni un
 * reconocimiento manual desde el último día de corte/pago y ya pasó esa
 * fecha, cuenta los días transcurridos desde entonces. Devuelve 0 si está al
 * día, inactiva o ya saldada.
 */
export function calcularDiasMora(deuda: Deuda, pagos: PagoDeuda[], hoy: Date = new Date()): number {
  if (!deuda.activa || deuda.saldoActual <= 0) return 0;

  const corte = ultimoCorte(deuda.diaCorteOPago, hoy);

  if (deuda.moraReconocidaHasta && deuda.moraReconocidaHasta >= formatFecha(corte)) return 0;

  // La ventana válida es el ciclo que este corte cierra, no solo lo posterior al corte: un pago
  // hecho dentro del ciclo pero antes del día de corte (es decir, pagando antes de la fecha
  // límite) quedaba invisible y la deuda se reportaba en mora por haber pagado a tiempo.
  const inicioCiclo = corteAnterior(deuda.diaCorteOPago, corte);

  const abonadoEnElCiclo = pagos.reduce((suma, p) => {
    if (p.deuda_id !== deuda.id) return suma;
    const [anio, mes, dia] = p.fecha.split("-").map(Number);
    return new Date(anio, mes - 1, dia) >= inicioCiclo ? suma + p.monto : suma;
  }, 0);

  // Con cuota mínima definida, un abono simbólico no cubre el ciclo; antes cualquier pago de $1
  // bastaba para dar la deuda por al día.
  const minimoExigido = deuda.pagoMinimoMensual > 0 ? deuda.pagoMinimoMensual : Number.MIN_VALUE;
  if (abonadoEnElCiclo >= minimoExigido) return 0;

  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = diferenciaDias(hoySinHora, corte);
  return dias > 0 ? dias : 0;
}
