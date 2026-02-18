import {
  Deuda,
  EstrategiaOrden,
  ResultadoSimulacion,
  MesSimulado,
  PagoMensualDeuda,
  ResumenDeudaProyeccion,
} from "@/types";

interface DeudaSim {
  id: string;
  nombre: string;
  saldo: number;
  saldoInicialSim: number;
  tasaMensual: number;
  tasaAnual: number;
  pagoMinimo: number;
  pagada: boolean;
  mesPagada: number | null;
}

/**
 * Simula el método de bola de nieve (o avalancha) para pagar deudas.
 */
export function simularBolaDeNieve(
  deudas: Deuda[],
  presupuestoMensual: number,
  mesesMax: number,
  estrategia: EstrategiaOrden,
  fechaInicio: string // "YYYY-MM"
): ResultadoSimulacion {
  // Filter only active debts with balance > 0
  let deudasSim: DeudaSim[] = deudas
    .filter((d) => d.activa && d.saldoActual > 0)
    .map((d) => ({
      id: d.id,
      nombre: d.nombre,
      saldo: d.saldoActual,
      saldoInicialSim: d.saldoActual,
      tasaMensual: d.tasaInteresAnual / 12 / 100,
      tasaAnual: d.tasaInteresAnual,
      pagoMinimo: d.pagoMinimoMensual,
      pagada: false,
      mesPagada: null,
    }));

  // Sort according to strategy
  sortDeudas(deudasSim, estrategia);

  const calendario: MesSimulado[] = [];
  let totalIntereses = 0;
  let mesNumero = 0;

  const [anioInicio, mesInicio] = fechaInicio.split("-").map(Number);

  while (mesNumero < mesesMax) {
    const activas = deudasSim.filter((d) => !d.pagada);
    if (activas.length === 0) break;

    mesNumero++;
    const fechaMes = calcularFecha(anioInicio, mesInicio, mesNumero);

    // 1. Apply interest to all active debts
    for (const d of activas) {
      const interes = d.saldo * d.tasaMensual;
      d.saldo += interes;
      totalIntereses += interes;
    }

    // 2. Calculate minimum payments
    let totalMinimos = 0;
    const pagosMinimos: Map<string, number> = new Map();

    for (const d of activas) {
      const minPago = Math.min(d.pagoMinimo, d.saldo);
      pagosMinimos.set(d.id, minPago);
      totalMinimos += minPago;
    }

    // 3. Calculate extra money
    let dineroExtra = Math.max(0, presupuestoMensual - totalMinimos);

    // 4. Apply minimum payments
    for (const d of activas) {
      const pago = pagosMinimos.get(d.id) || 0;
      d.saldo -= pago;
    }

    // 5. Apply extra to the first unpaid debt (sorted by strategy)
    // Re-sort active debts each month
    const activasSorted = activas.filter((d) => d.saldo > 0);
    sortDeudas(activasSorted, estrategia);

    for (const d of activasSorted) {
      if (dineroExtra <= 0) break;
      const extraPago = Math.min(dineroExtra, d.saldo);
      d.saldo -= extraPago;
      dineroExtra -= extraPago;
      pagosMinimos.set(d.id, (pagosMinimos.get(d.id) || 0) + extraPago);
    }

    // 6. Build monthly record
    const pagosMes: PagoMensualDeuda[] = deudasSim.map((d) => {
      const pagoTotal = pagosMinimos.get(d.id) || 0;
      const interesMes = d.saldoInicialSim > 0 ? d.saldo >= 0 ? (d.saldo + pagoTotal) * d.tasaMensual / (1 + d.tasaMensual) : 0 : 0;
      // Simplified: interest portion is approximate
      const interesAprox = Math.min(pagoTotal, (d.saldo + pagoTotal) * d.tasaMensual);

      if (d.saldo <= 0.01 && !d.pagada) {
        d.saldo = 0;
        d.pagada = true;
        d.mesPagada = mesNumero;
      }

      return {
        deudaId: d.id,
        nombreDeuda: d.nombre,
        pagoTotal,
        abonoInteres: Math.max(0, Math.round(interesAprox * 100) / 100),
        abonoCapital: Math.max(0, Math.round((pagoTotal - interesAprox) * 100) / 100),
        saldoFinal: Math.max(0, Math.round(d.saldo * 100) / 100),
        pagada: d.pagada,
      };
    });

    calendario.push({
      mesNumero,
      fecha: fechaMes,
      pagos: pagosMes,
    });
  }

  // Build summary
  const ordenPago: ResumenDeudaProyeccion[] = deudasSim
    .sort((a, b) => {
      if (a.mesPagada === null && b.mesPagada === null) return 0;
      if (a.mesPagada === null) return 1;
      if (b.mesPagada === null) return -1;
      return a.mesPagada - b.mesPagada;
    })
    .map((d, i) => ({
      prioridad: i + 1,
      deudaId: d.id,
      nombreDeuda: d.nombre,
      saldoInicialSimulacion: d.saldoInicialSim,
      tasaInteresAnual: d.tasaAnual,
      pagoMinimoMensual: d.pagoMinimo,
      mesEstimadoPago: d.mesPagada,
      fechaEstimadaPago: d.mesPagada
        ? calcularFecha(anioInicio, mesInicio, d.mesPagada)
        : null,
    }));

  const todasPagadas = deudasSim.every((d) => d.pagada);
  const ultimoMesPago = todasPagadas
    ? Math.max(...deudasSim.map((d) => d.mesPagada || 0))
    : null;

  return {
    ordenPago,
    calendario,
    mesLibreDeDeudas: ultimoMesPago,
    fechaLibreDeDeudas: ultimoMesPago
      ? calcularFecha(anioInicio, mesInicio, ultimoMesPago)
      : null,
    totalInteresesPagados: Math.round(totalIntereses * 100) / 100,
    mesesSimulados: mesNumero,
  };
}

function sortDeudas(deudas: DeudaSim[], estrategia: EstrategiaOrden): void {
  if (estrategia === "SaldoAscendente") {
    deudas.sort((a, b) => a.saldo - b.saldo);
  } else {
    deudas.sort((a, b) => b.tasaAnual - a.tasaAnual);
  }
}

function calcularFecha(anioInicio: number, mesInicio: number, mesesAdelante: number): string {
  const totalMeses = mesInicio - 1 + mesesAdelante;
  const anio = anioInicio + Math.floor(totalMeses / 12);
  const mes = (totalMeses % 12) + 1;
  return `${anio}-${String(mes).padStart(2, "0")}`;
}
