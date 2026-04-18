import { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  metaNombre: string;
  falta: number;
  sugerencia: number;
  onSubmit: (monto: number) => void;
  onCancel: () => void;
}

export default function AporteDialog({ metaNombre, falta, sugerencia, onSubmit, onCancel }: Props) {
  const [monto, setMonto] = useState<string>(sugerencia > 0 ? sugerencia.toString() : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(monto);
    if (!isNaN(val) && val > 0) {
      onSubmit(val);
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
          <Input
            id="monto"
            type="number"
            step="0.01"
            className="col-span-3"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
            autoFocus
          />
        </div>
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" onClick={handleSubmit}>Guardar Aporte</Button>
      </DialogFooter>
    </DialogContent>
  );
}
