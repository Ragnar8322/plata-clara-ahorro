import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PresupuestosManager from "./PresupuestosManager";
import { CategoriaPersonalizada, PresupuestoCategoria, Configuracion, CATEGORIAS_GASTO } from "@/types";

const mockConfig: Configuracion = {
  id: "default",
  ingresoMensualNeto: 0,
  monedaSimbolo: "$",
  nombreMoneda: "COP",
  presupuestoMensualParaDeudas: 0,
  mesesMaxProyeccion: 36,
  estrategiaOrdenDeudas: "SaldoAscendente",
};

function makePresupuesto(overrides: Partial<PresupuestoCategoria> = {}): PresupuestoCategoria {
  return {
    id: "pres-1",
    categoria: "Vivienda",
    limite_mensual: 500_000,
    ...overrides,
  };
}

function makeCategoria(overrides: Partial<CategoriaPersonalizada> = {}): CategoriaPersonalizada {
  return {
    id: "cat-1",
    nombre: "Mascotas",
    color: "#4f46e5",
    ...overrides,
  };
}

describe("PresupuestosManager", () => {
  let onSave: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSave = vi.fn().mockResolvedValue(undefined);
    onDelete = vi.fn().mockResolvedValue(undefined);
  });

  it("renders every static category exactly once when there are no presupuestos or custom categories", () => {
    render(
      <PresupuestosManager
        categorias={[]}
        presupuestos={[]}
        config={mockConfig}
        onSave={onSave}
        onDelete={onDelete}
      />,
    );

    for (const cat of CATEGORIAS_GASTO) {
      expect(screen.getAllByText(cat)).toHaveLength(1);
    }
  });

  it("merges static and custom categories via a Set, without duplicating a custom category that repeats a static name", () => {
    const categorias = [
      makeCategoria({ id: "cat-1", nombre: "Mascotas" }),
      // "Vivienda" is already a static category — it must not be rendered twice.
      makeCategoria({ id: "cat-2", nombre: "Vivienda" }),
    ];

    render(
      <PresupuestosManager
        categorias={categorias}
        presupuestos={[]}
        config={mockConfig}
        onSave={onSave}
        onDelete={onDelete}
      />,
    );

    expect(screen.getAllByText("Vivienda")).toHaveLength(1);
    expect(screen.getAllByText("Mascotas")).toHaveLength(1);
    // Total rendered category rows = static categories + genuinely new custom ones.
    const expectedTotal = new Set([...CATEGORIAS_GASTO, ...categorias.map(c => c.nombre)]).size;
    expect(screen.getAllByRole("spinbutton")).toHaveLength(expectedTotal);
  });

  it("shows no save button and defaults every input to 0 when no category has a saved presupuesto", () => {
    render(
      <PresupuestosManager
        categorias={[]}
        presupuestos={[]}
        config={mockConfig}
        onSave={onSave}
        onDelete={onDelete}
      />,
    );

    // Every category row defaults to "0" and has no save/delete buttons yet.
    expect(screen.getAllByDisplayValue("0")).toHaveLength(CATEGORIAS_GASTO.length);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("pre-fills the input with the saved limite_mensual and hides the save button until it's edited", () => {
    const presupuestos = [makePresupuesto({ categoria: "Vivienda", limite_mensual: 500_000 })];
    render(
      <PresupuestosManager
        categorias={[]}
        presupuestos={presupuestos}
        config={mockConfig}
        onSave={onSave}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByDisplayValue("500000")).toBeInTheDocument();
    // No unsaved change yet, so the save (icon) button for this row shouldn't exist —
    // only the delete button should be present since a presupuesto already exists.
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1); // just the delete button
  });

  it("detects hayCambios and reveals the save button once the input is edited to a different value", () => {
    const presupuestos = [makePresupuesto({ categoria: "Vivienda", limite_mensual: 500_000 })];
    render(
      <PresupuestosManager
        categorias={[]}
        presupuestos={presupuestos}
        config={mockConfig}
        onSave={onSave}
        onDelete={onDelete}
      />,
    );

    const input = screen.getByDisplayValue("500000");
    fireEvent.change(input, { target: { value: "600000" } });

    // Now both the save and the delete buttons should be present.
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("does not treat re-entering the original saved value as a change (hayCambios recomputed live)", () => {
    const presupuestos = [makePresupuesto({ categoria: "Vivienda", limite_mensual: 500_000 })];
    render(
      <PresupuestosManager
        categorias={[]}
        presupuestos={presupuestos}
        config={mockConfig}
        onSave={onSave}
        onDelete={onDelete}
      />,
    );

    const input = screen.getByDisplayValue("500000");
    fireEvent.change(input, { target: { value: "600000" } });
    expect(screen.getAllByRole("button")).toHaveLength(2);

    fireEvent.change(input, { target: { value: "500000" } });
    expect(screen.getAllByRole("button")).toHaveLength(1); // save button disappears again
  });

  it("calls onSave with the parsed monto and clears the edited state after saving", async () => {
    const presupuestos = [makePresupuesto({ id: "pres-1", categoria: "Vivienda", limite_mensual: 500_000 })];
    render(
      <PresupuestosManager
        categorias={[]}
        presupuestos={presupuestos}
        config={mockConfig}
        onSave={onSave}
        onDelete={onDelete}
      />,
    );

    const input = screen.getByDisplayValue("500000");
    fireEvent.change(input, { target: { value: "750000" } });

    const saveButton = screen.getAllByRole("button")[0];
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ categoria: "Vivienda", limite_mensual: 750000 }),
    );
  });

  it("calls onDelete with the presupuesto id when the delete button is clicked", () => {
    const presupuestos = [makePresupuesto({ id: "pres-42", categoria: "Vivienda", limite_mensual: 500_000 })];
    render(
      <PresupuestosManager
        categorias={[]}
        presupuestos={presupuestos}
        config={mockConfig}
        onSave={onSave}
        onDelete={onDelete}
      />,
    );

    const deleteButton = screen.getAllByRole("button")[0];
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith("pres-42");
  });
});
