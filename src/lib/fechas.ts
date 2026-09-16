export function diasEnMes(anio: number, mes: number): number {
  return new Date(anio, mes + 1, 0).getDate();
}

/**
 * Ajusta un día de calendario configurado (1-31) al mes real. Un pago fijado el 30 cae el 28 en
 * febrero; sin este ajuste la fecha se desbordaría al mes siguiente y el pago nunca se daría por
 * recibido dentro del mes.
 */
export function clampDiaDelMes(dia: number, anio: number, mes: number): number {
  return Math.min(Math.max(Math.trunc(dia), 1), diasEnMes(anio, mes));
}
