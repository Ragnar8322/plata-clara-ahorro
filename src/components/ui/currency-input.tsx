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
      const digits = e.target.value.replace(/\D/g, "");
      onChange(digits ? Number(digits) : undefined);
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
