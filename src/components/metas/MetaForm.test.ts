import { describe, it, expect } from "vitest";
import { metaSchema } from "./MetaForm";

function makeMeta(overrides: Record<string, unknown> = {}) {
  return {
    nombre: "Vacaciones",
    emoji: "🎯",
    monto_objetivo: 1000000,
    aporte_mensual_planeado: 100000,
    fecha_objetivo: "",
    color: "#16a34a",
    notas: "",
    ...overrides,
  };
}

describe("metaSchema", () => {
  it("acepta un caso válido", () => {
    const resultado = metaSchema.safeParse(makeMeta());
    expect(resultado.success).toBe(true);
  });

  it("rechaza un emoji de más de 2 caracteres", () => {
    const resultado = metaSchema.safeParse(makeMeta({ emoji: "🎯🎯🎯" }));
    expect(resultado.success).toBe(false);
  });

  it("rechaza monto_objetivo menor o igual a 0", () => {
    const resultado = metaSchema.safeParse(makeMeta({ monto_objetivo: 0 }));
    expect(resultado.success).toBe(false);
  });

  it("rechaza aporte_mensual_planeado negativo", () => {
    const resultado = metaSchema.safeParse(makeMeta({ aporte_mensual_planeado: -1 }));
    expect(resultado.success).toBe(false);
  });
});
