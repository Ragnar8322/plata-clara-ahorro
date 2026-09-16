import { describe, it, expect } from "vitest";
import { normalizarFrecuencia, montoMensualEquivalente, totalIngresoMensual, ingresoMensualEfectivo } from "./ingresos";
import { Ingreso } from "@/types";

function makeIngreso(overrides: Partial<Ingreso> = {}): Ingreso {
  return {
    id: "ing-1",
    nombre: "Salario",
    monto: 1_000_000,
    frecuencia: "Mensual",
    ...overrides,
  };
}

describe("normalizarFrecuencia", () => {
  it("conserva las frecuencias conocidas", () => {
    expect(normalizarFrecuencia("Quincenal")).toBe("Quincenal");
    expect(normalizarFrecuencia("Variable")).toBe("Variable");
  });

  it("cae a Mensual ante filas antiguas sin frecuencia o con un valor libre", () => {
    expect(normalizarFrecuencia(null)).toBe("Mensual");
    expect(normalizarFrecuencia(undefined)).toBe("Mensual");
    expect(normalizarFrecuencia("Semanal")).toBe("Mensual");
  });
});

describe("montoMensualEquivalente", () => {
  it("duplica el monto quincenal", () => {
    expect(montoMensualEquivalente(makeIngreso({ monto: 1_500_000, frecuencia: "Quincenal" }))).toBe(3_000_000);
  });

  it("deja igual el mensual y el variable", () => {
    expect(montoMensualEquivalente(makeIngreso({ monto: 2_000_000 }))).toBe(2_000_000);
    expect(montoMensualEquivalente(makeIngreso({ monto: 500_000, frecuencia: "Variable" }))).toBe(500_000);
  });
});

describe("totalIngresoMensual", () => {
  it("suma fuentes de distinta frecuencia en su equivalente mensual", () => {
    const total = totalIngresoMensual([
      makeIngreso({ id: "a", monto: 1_500_000, frecuencia: "Quincenal" }),
      makeIngreso({ id: "b", monto: 800_000, frecuencia: "Mensual" }),
    ]);
    expect(total).toBe(3_800_000);
  });
});

describe("ingresoMensualEfectivo", () => {
  it("usa el ingreso configurado cuando las fuentes suman cero", () => {
    expect(ingresoMensualEfectivo([makeIngreso({ monto: 0 })], 2_000_000)).toBe(2_000_000);
    expect(ingresoMensualEfectivo([], 2_000_000)).toBe(2_000_000);
  });

  it("prefiere las fuentes registradas sobre el ingreso configurado", () => {
    const ingresos = [makeIngreso({ monto: 1_000_000, frecuencia: "Quincenal" })];
    expect(ingresoMensualEfectivo(ingresos, 2_000_000)).toBe(2_000_000);
    expect(ingresoMensualEfectivo(ingresos, 0)).toBe(2_000_000);
  });

  it("nunca devuelve un ingreso negativo", () => {
    expect(ingresoMensualEfectivo([], -100)).toBe(0);
  });
});
