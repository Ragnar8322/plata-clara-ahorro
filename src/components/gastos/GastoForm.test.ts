import { describe, it, expect } from "vitest";
import { gastoSchema } from "./GastoForm";

function makeGasto(overrides: Record<string, unknown> = {}) {
  return {
    fecha: "2026-08-01",
    categoria: "Vivienda",
    descripcion: "Arriendo mensual",
    monto: 500000,
    metodoPago: "Transferencia",
    tipo: "Fijo",
    frecuencia: "Mensual",
    notas: "",
    deudaId: "",
    ...overrides,
  };
}

describe("gastoSchema", () => {
  it("acepta un caso válido", () => {
    const resultado = gastoSchema.safeParse(makeGasto());
    expect(resultado.success).toBe(true);
  });

  it("rechaza monto negativo", () => {
    const resultado = gastoSchema.safeParse(makeGasto({ monto: -10 }));
    expect(resultado.success).toBe(false);
  });

  it("rechaza monto igual a 0", () => {
    const resultado = gastoSchema.safeParse(makeGasto({ monto: 0 }));
    expect(resultado.success).toBe(false);
  });

  it("rechaza cuando falta la descripción", () => {
    const resultado = gastoSchema.safeParse(makeGasto({ descripcion: "" }));
    expect(resultado.success).toBe(false);
  });
});
