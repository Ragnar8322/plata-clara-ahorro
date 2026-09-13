import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CurrencyInput } from "./currency-input";

function escribir(valor: string) {
  const onChange = vi.fn();
  render(<CurrencyInput aria-label="monto" value={undefined} onChange={onChange} />);
  fireEvent.change(screen.getByLabelText("monto"), { target: { value: valor } });
  return onChange;
}

describe("CurrencyInput", () => {
  it("interpreta el punto como separador de miles", () => {
    expect(escribir("1.500")).toHaveBeenCalledWith(1500);
  });

  // Antes se borraba todo lo que no fuera dígito, así que "1.500,50" se guardaba como 150.050:
  // cien veces el valor real.
  it("interpreta la coma como separador decimal y no infla el monto", () => {
    expect(escribir("1.500,50")).toHaveBeenCalledWith(1500.5);
  });

  it("devuelve undefined cuando el campo queda vacío", () => {
    const onChange = vi.fn();
    render(<CurrencyInput aria-label="monto" value={1500} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("monto"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("ignora entradas que superan la precisión segura de JavaScript", () => {
    const onChange = escribir("9".repeat(19));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("formatea el valor recibido con separadores colombianos", () => {
    render(<CurrencyInput aria-label="saldo" value={1500000} onChange={() => {}} />);
    expect(screen.getByLabelText("saldo")).toHaveValue("1.500.000");
  });
});
