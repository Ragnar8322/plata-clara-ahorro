import { describe, it, expect } from "vitest";
import {
  normalizarFrecuencia, montoMensualEquivalente, totalIngresoMensual, ingresoMensualEfectivo,
  diasDePago, montoRecibidoEsteMes, totalRecibidoEsteMes, conteoPagosDelMes, proximoDiaDePago,
} from "./ingresos";
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

describe("diasDePago", () => {
  const quincenal = makeIngreso({ frecuencia: "Quincenal", dia_pago: 15, dia_pago_2: 30 });

  it("usa los días configurados", () => {
    expect(diasDePago(quincenal, 2026, 8)).toEqual([15, 30]); // septiembre, 30 días
  });

  it("ajusta el día 30 al último día en febrero", () => {
    expect(diasDePago(quincenal, 2026, 1)).toEqual([15, 28]);
  });

  it("cae a 15 y 30 en fuentes quincenales antiguas sin día configurado", () => {
    expect(diasDePago(makeIngreso({ frecuencia: "Quincenal" }), 2026, 8)).toEqual([15, 30]);
  });

  it("una fuente mensual sin día configurado se paga el último día del mes", () => {
    expect(diasDePago(makeIngreso({ frecuencia: "Mensual" }), 2026, 1)).toEqual([28]);
  });

  it("una fuente variable está disponible desde el día 1", () => {
    expect(diasDePago(makeIngreso({ frecuencia: "Variable" }), 2026, 8)).toEqual([1]);
  });
});

describe("montoRecibidoEsteMes", () => {
  const sueldo = makeIngreso({ monto: 1_500_000, frecuencia: "Quincenal", dia_pago: 15, dia_pago_2: 30 });

  it("no cuenta nada antes del primer día de pago", () => {
    expect(montoRecibidoEsteMes(sueldo, new Date(2026, 8, 14))).toBe(0);
  });

  it("cuenta la primera quincena desde el inicio del día 15", () => {
    expect(montoRecibidoEsteMes(sueldo, new Date(2026, 8, 15, 0, 0))).toBe(1_500_000);
  });

  it("sigue contando solo una quincena entre el 15 y el 30", () => {
    expect(montoRecibidoEsteMes(sueldo, new Date(2026, 8, 29))).toBe(1_500_000);
  });

  it("cuenta las dos quincenas el día 30", () => {
    expect(montoRecibidoEsteMes(sueldo, new Date(2026, 8, 30))).toBe(3_000_000);
  });

  it("en febrero la segunda quincena entra el día 28", () => {
    expect(montoRecibidoEsteMes(sueldo, new Date(2026, 1, 28))).toBe(3_000_000);
  });
});

describe("totalRecibidoEsteMes", () => {
  it("suma solo los pagos de cada fuente cuya fecha ya llegó", () => {
    const fuentes = [
      makeIngreso({ id: "a", monto: 1_000_000, frecuencia: "Quincenal", dia_pago: 15, dia_pago_2: 30 }),
      makeIngreso({ id: "b", monto: 500_000, frecuencia: "Mensual", dia_pago: 5 }),
    ];
    expect(totalRecibidoEsteMes(fuentes, new Date(2026, 8, 20))).toBe(1_500_000);
  });
});

describe("conteoPagosDelMes", () => {
  it("reporta cuántos pagos entraron sobre el total del mes", () => {
    const fuentes = [makeIngreso({ frecuencia: "Quincenal", dia_pago: 15, dia_pago_2: 30 })];
    expect(conteoPagosDelMes(fuentes, new Date(2026, 8, 20))).toEqual({ recibidos: 1, totales: 2 });
  });
});

describe("proximoDiaDePago", () => {
  const fuentes = [makeIngreso({ frecuencia: "Quincenal", dia_pago: 15, dia_pago_2: 30 })];

  it("devuelve el siguiente día pendiente del mes", () => {
    expect(proximoDiaDePago(fuentes, new Date(2026, 8, 20))).toBe(30);
  });

  it("devuelve null cuando ya entraron todos los pagos del mes", () => {
    expect(proximoDiaDePago(fuentes, new Date(2026, 8, 30))).toBeNull();
  });
});
