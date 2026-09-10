import { describe, it, expect } from "vitest";
import { calcularDiasMora } from "./moraCalculator";
import { Deuda, PagoDeuda } from "@/types";

function makeDeuda(overrides: Partial<Deuda> = {}): Deuda {
  return {
    id: "d1",
    nombre: "Tarjeta",
    tipo: "Tarjeta de crédito",
    entidad: "Banco",
    saldoInicial: 1_000_000,
    saldoActual: 500_000,
    tasaInteresAnual: 20,
    pagoMinimoMensual: 50_000,
    diaCorteOPago: 15,
    pagoExtraPlaneadoMensual: 0,
    activa: true,
    ...overrides,
  };
}

function makePago(overrides: Partial<PagoDeuda> = {}): PagoDeuda {
  return {
    id: "p1",
    deuda_id: "d1",
    monto: 50_000,
    fecha: "2026-03-15",
    ...overrides,
  };
}

describe("calcularDiasMora", () => {
  it("returns 0 when the deuda is inactive", () => {
    const deuda = makeDeuda({ activa: false, diaCorteOPago: 1 });
    const hoy = new Date(2026, 2, 20); // 20 marzo 2026
    expect(calcularDiasMora(deuda, [], hoy)).toBe(0);
  });

  it("returns 0 when the deuda is already paid off (saldoActual <= 0)", () => {
    const deuda = makeDeuda({ saldoActual: 0, diaCorteOPago: 1 });
    const hoy = new Date(2026, 2, 20);
    expect(calcularDiasMora(deuda, [], hoy)).toBe(0);
  });

  it("carries mora over from the previous cycle when this month's corte hasn't arrived yet", () => {
    // Corte day 20, today is the 10th — this month's corte hasn't happened yet,
    // but the PREVIOUS month's corte (Feb 20) has no payment either, so it IS in mora.
    const deuda = makeDeuda({ diaCorteOPago: 20 });
    const hoy = new Date(2026, 2, 10); // 10 marzo 2026
    // Último corte vigente = 20 febrero 2026. Del 20 feb al 10 mar = 18 días.
    expect(calcularDiasMora(deuda, [], hoy)).toBe(18);
  });

  it("returns 0 when a payment was registered on/after the current cycle's corte date", () => {
    const deuda = makeDeuda({ diaCorteOPago: 15 });
    const hoy = new Date(2026, 2, 20); // 20 marzo 2026, corte vigente = 15 marzo
    const pagos = [makePago({ fecha: "2026-03-16" })]; // pago después del corte
    expect(calcularDiasMora(deuda, pagos, hoy)).toBe(0);
  });

  it("counts days overdue when no payment was made since the current cycle's corte date", () => {
    const deuda = makeDeuda({ diaCorteOPago: 15 });
    const hoy = new Date(2026, 2, 25); // 25 marzo 2026, corte vigente = 15 marzo
    // Pago viejo, de un ciclo anterior — no cubre el corte de este ciclo.
    const pagos = [makePago({ fecha: "2026-02-14" })];
    expect(calcularDiasMora(deuda, pagos, hoy)).toBe(10);
  });

  it("ignores payments belonging to a different deuda", () => {
    const deuda = makeDeuda({ id: "d1", diaCorteOPago: 15 });
    const hoy = new Date(2026, 2, 20);
    const pagos = [makePago({ deuda_id: "otra-deuda", fecha: "2026-03-16" })];
    expect(calcularDiasMora(deuda, pagos, hoy)).toBe(5);
  });

  it("returns 0 on the corte day itself with no payment yet (grace within the same day)", () => {
    const deuda = makeDeuda({ diaCorteOPago: 15 });
    const hoy = new Date(2026, 2, 15);
    expect(calcularDiasMora(deuda, [], hoy)).toBe(0);
  });

  it("clamps diaCorteOPago to the last day of a shorter month (31 in a 30-day month)", () => {
    const deuda = makeDeuda({ diaCorteOPago: 31 });
    const hoy = new Date(2026, 3, 5); // 5 abril 2026 — abril tiene 30 días
    // Corte vigente = 30 marzo (clamp de 31 en un mes de 31 días... marzo tiene 31,
    // así que el corte de marzo es el 31; hoy 5 abril aún no llega al corte de abril (30),
    // por lo que el ciclo vigente es el de marzo (31 marzo). Del 31 mar al 5 abr = 5 días.
    expect(calcularDiasMora(deuda, [], hoy)).toBe(5);
  });
});
