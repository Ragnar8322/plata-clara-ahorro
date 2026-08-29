import { describe, it, expect } from "vitest";
import { sugerirEmoji } from "./metaEmoji";

describe("sugerirEmoji", () => {
  it("sugiere 🎮 para consolas de videojuegos", () => {
    expect(sugerirEmoji("Comprar un PS5")).toBe("🎮");
    expect(sugerirEmoji("Nintendo Switch")).toBe("🎮");
  });

  it("sugiere ✈️ para viajes", () => {
    expect(sugerirEmoji("Viaje a Cartagena")).toBe("✈️");
  });

  it("sugiere 🏠 para vivienda", () => {
    expect(sugerirEmoji("Cuota inicial casa")).toBe("🏠");
  });

  it("ignora mayúsculas y tildes", () => {
    expect(sugerirEmoji("VIAJE")).toBe("✈️");
    expect(sugerirEmoji("emergencia médica")).toBe("🏥");
  });

  it("retorna null si no hay coincidencia", () => {
    expect(sugerirEmoji("algo sin palabras clave")).toBeNull();
  });

  it("retorna null para texto vacío", () => {
    expect(sugerirEmoji("")).toBeNull();
    expect(sugerirEmoji("   ")).toBeNull();
  });
});
