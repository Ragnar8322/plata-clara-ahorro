import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import GastosTable from "./GastosTable";
import { Gasto, Configuracion } from "@/types";
import { formatMoney } from "@/lib/formatters";

const config: Configuracion = {
  id: "default",
  ingresoMensualNeto: 0,
  monedaSimbolo: "$",
  nombreMoneda: "COP",
  presupuestoMensualParaDeudas: 0,
  mesesMaxProyeccion: 36,
  estrategiaOrdenDeudas: "SaldoAscendente",
};

function makeGasto(overrides: Partial<Gasto>): Gasto {
  return {
    id: overrides.id ?? "id",
    fecha: "2026-01-01",
    categoria: "Otros",
    descripcion: "Gasto",
    monto: 1000,
    metodoPago: "Efectivo",
    tipo: "Variable",
    frecuencia: "Único",
    ...overrides,
  };
}

describe("GastosTable", () => {
  it("filters gastos by category using the categoria select", () => {
    const gastos = [
      makeGasto({ id: "1", categoria: "Vivienda", descripcion: "Arriendo", fecha: "2026-01-01" }),
      makeGasto({ id: "2", categoria: "Transporte", descripcion: "Gasolina", fecha: "2026-01-02" }),
    ];
    render(<GastosTable gastos={gastos} config={config} onEdit={vi.fn()} onDelete={vi.fn()} />);

    // Both rows visible initially
    expect(screen.getByText("Arriendo")).toBeInTheDocument();
    expect(screen.getByText("Gasolina")).toBeInTheDocument();

    // Open the "Categoría" select and choose "Transporte".
    // "Categoría" also appears as a table column header, so scope to the <label>.
    const categoriaLabel = screen.getAllByText("Categoría").find((el) => el.tagName === "LABEL")!;
    const categoriaSelect = categoriaLabel.parentElement!;
    const trigger = within(categoriaSelect).getByRole("combobox");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "Transporte" }));

    expect(screen.queryByText("Arriendo")).not.toBeInTheDocument();
    expect(screen.getByText("Gasolina")).toBeInTheDocument();
  });

  it("filters gastos by search text (busqueda)", () => {
    const gastos = [
      makeGasto({ id: "1", descripcion: "Arriendo apartamento", fecha: "2026-01-01" }),
      makeGasto({ id: "2", descripcion: "Compra mercado", fecha: "2026-01-02" }),
    ];
    render(<GastosTable gastos={gastos} config={config} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText("Ej. Arriendo");
    fireEvent.change(searchInput, { target: { value: "mercado" } });

    expect(screen.queryByText("Arriendo apartamento")).not.toBeInTheDocument();
    expect(screen.getByText("Compra mercado")).toBeInTheDocument();
  });

  it("computes the total grouped by category correctly", () => {
    const gastos = [
      makeGasto({ id: "1", categoria: "Vivienda", monto: 500_000 }),
      makeGasto({ id: "2", categoria: "Vivienda", monto: 300_000 }),
      makeGasto({ id: "3", categoria: "Transporte", monto: 100_000 }),
    ];
    render(<GastosTable gastos={gastos} config={config} onEdit={vi.fn()} onDelete={vi.fn()} />);

    // Overall total: 500_000 + 300_000 + 100_000 = 900_000
    expect(screen.getByText(formatMoney(900_000, config))).toBeInTheDocument();

    // Category cards render a <p class="text-xs ..."> label followed by a value <p>;
    // the "Vivienda" and "Transporte" strings also appear in the table's Categoría
    // column, so scope the lookup to the label <p> to find the right card.
    const viviendaLabel = screen.getAllByText("Vivienda").find((el) => el.tagName === "P")!;
    expect(viviendaLabel.nextElementSibling).toHaveTextContent(formatMoney(800_000, config));

    const transporteLabel = screen.getAllByText("Transporte").find((el) => el.tagName === "P")!;
    expect(transporteLabel.nextElementSibling).toHaveTextContent(formatMoney(100_000, config));
  });

  it("sorts gastos in descending order by date", () => {
    const gastos = [
      makeGasto({ id: "1", fecha: "2026-01-01", descripcion: "Más antiguo" }),
      makeGasto({ id: "2", fecha: "2026-03-01", descripcion: "Más reciente" }),
      makeGasto({ id: "3", fecha: "2026-02-01", descripcion: "Intermedio" }),
    ];
    render(<GastosTable gastos={gastos} config={config} onEdit={vi.fn()} onDelete={vi.fn()} />);

    const rows = screen.getAllByRole("row").slice(1); // skip header row
    const descriptions = rows.map((row) => within(row).getByText(/Más reciente|Intermedio|Más antiguo/).textContent);
    expect(descriptions).toEqual(["Más reciente", "Intermedio", "Más antiguo"]);
  });

  it("paginates results when there are more gastos than fit on one page", () => {
    // itemsPorPagina = 10, so 15 gastos should produce 2 pages
    const gastos = Array.from({ length: 15 }, (_, i) =>
      makeGasto({
        id: `id-${i}`,
        fecha: `2026-01-${String(i + 1).padStart(2, "0")}`,
        descripcion: `Gasto ${i + 1}`,
      }),
    );
    render(<GastosTable gastos={gastos} config={config} onEdit={vi.fn()} onDelete={vi.fn()} />);

    // Page 1 shows "Mostrando 1 a 10 de 15" and 10 data rows
    expect(screen.getByText(/Mostrando 1 a 10 de 15/)).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(11); // header + 10 data rows

    // Go to page 2
    const nextButton = screen.getAllByRole("button").find((b) => b.querySelector(".lucide-chevron-right"))!;
    fireEvent.click(nextButton);

    expect(screen.getByText(/Mostrando 11 a 15 de 15/)).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(6); // header + 5 remaining rows
  });

  it("shows an empty state and no crash when there are no gastos", () => {
    expect(() =>
      render(<GastosTable gastos={[]} config={config} onEdit={vi.fn()} onDelete={vi.fn()} />),
    ).not.toThrow();
    expect(screen.getByText("No hay gastos registrados.")).toBeInTheDocument();
  });
});
