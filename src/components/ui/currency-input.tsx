import * as React from "react";
import { Input } from "@/components/ui/input";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const displayValue =
      value === undefined || value === null || Number.isNaN(value)
        ? ""
        : Number(value).toLocaleString("es-CO");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Formato colombiano: "." separa miles y "," decimales. Borrar todo lo que no fuese dígito
      // convertía "1.500,50" en 150.050 (cien veces más). Se descartan los separadores de miles
      // y se conserva la parte decimal.
      const limpio = e.target.value.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
      if (!limpio) {
        onChange(undefined);
        return;
      }
      const valor = Number(limpio);
      if (!Number.isFinite(valor) || valor > Number.MAX_SAFE_INTEGER) return;
      onChange(valor);
    };

    return (
      <Input
        {...props}
        ref={ref}
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
      />
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
