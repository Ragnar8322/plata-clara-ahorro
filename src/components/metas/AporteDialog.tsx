import { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";

interface Props {
  metaNombre: string;
  falta: number;
  sugerencia: number;
  onSubmit: (monto: number) => void;
  onCancel: () => void;
}

export default function AporteDialog({ metaNombre, falta, sugerencia, onSubmit, onCancel }: Props) {
  const [monto, setMonto] = useState<number | undefined>(sugerencia > 0 ? sugerencia : undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (monto && monto > 0) {
      onSubmit(monto);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Registrar Aporte</DialogTitle>
        <DialogDescription>
          Abonarás a la meta "{metaNombre}". Te faltan ${falta.toLocaleString()} para completarla.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="monto" className="text-right">
            Monto
          </Label>
          <CurrencyInput
            id="monto"
            className="col-span-3"
            value={monto}
            onChange={setMonto}
            required
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Guardar Aporte</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
