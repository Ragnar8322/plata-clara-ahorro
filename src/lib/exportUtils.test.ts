import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportToCSV } from "./exportUtils";

// El Blob de jsdom (v20) no implementa .text()/.arrayBuffer(), así que en vez de
// leer el contenido del Blob resultante, espiamos el constructor Blob para
// capturar los "parts" (el csvContent en texto plano) con los que fue invocado.
class MockBlob {
  parts: unknown[];
  options: unknown;
  constructor(parts: unknown[], options?: unknown) {
    this.parts = parts;
    this.options = options;
  }
}

function ultimoCsv(blobSpy: ReturnType<typeof vi.fn>): string {
  const instancia = blobSpy.mock.results[blobSpy.mock.results.length - 1].value as MockBlob;
  return (instancia.parts[0] as string) ?? "";
}

describe("exportToCSV", () => {
  let blobSpy: ReturnType<typeof vi.fn>;
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    blobSpy = vi.fn((parts: unknown[], options?: unknown) => new MockBlob(parts, options));
    vi.stubGlobal("Blob", blobSpy);

    createObjectURLSpy = vi.fn(() => "blob:mock-url");
    // jsdom no implementa createObjectURL / revokeObjectURL en URL
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: vi.fn(),
    });

    clickSpy = vi.fn();
    // Evita el "Not implemented: HTMLAnchorElement.prototype.click" de jsdom
    HTMLAnchorElement.prototype.click = clickSpy;

    appendChildSpy = vi.spyOn(document.body, "appendChild");
    removeChildSpy = vi.spyOn(document.body, "removeChild");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("retorna temprano y no crea el Blob/link cuando data.length === 0", () => {
    exportToCSV([], "vacio");

    expect(blobSpy).not.toHaveBeenCalled();
    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(appendChildSpy).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("escapa correctamente comas y comillas dentro de un valor", () => {
    exportToCSV([{ nombre: 'Café, "el bueno"', monto: 100 }], "datos");

    expect(blobSpy).toHaveBeenCalledTimes(1);
    const contenido = ultimoCsv(blobSpy);
    const lineas = contenido.split("\n");

    expect(lineas[1]).toBe('"Café, ""el bueno"""' + ",100");
  });

  it("genera los headers correctos en la primera línea del CSV", () => {
    exportToCSV(
      [
        { nombre: "Arriendo", monto: 500000, categoria: "Vivienda" },
      ],
      "gastos"
    );

    const contenido = ultimoCsv(blobSpy);
    const lineas = contenido.split("\n");

    expect(lineas[0]).toBe("nombre,monto,categoria");
  });

  it("crea el link, lo agrega al body, hace click y lo remueve", () => {
    exportToCSV([{ a: 1 }], "simple");

    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);
  });

  it("null o undefined se serializan como celda vacía", () => {
    exportToCSV([{ a: null, b: undefined, c: "x" }], "nulls");

    const contenido = ultimoCsv(blobSpy);
    const lineas = contenido.split("\n");

    expect(lineas[1]).toBe(',,"x"');
  });
});
