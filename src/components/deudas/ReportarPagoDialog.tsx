import { useEffect, useState } from "react";
import { Deuda, PagoDeuda } from "@/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deudas: Deuda[];
  deudaPreseleccionada?: Deuda | null;
  onSubmit?: (p: Omit<PagoDeuda, "id" | "user_id" | "created_at">) => Promise<any>;
}

export default function ReportarPagoDialog({ open, onOpenChange, deudas, deudaPreseleccionada, onSubmit }: Props) {
  const [deudaId, setDeudaId] = useState("");
  const [monto, setMonto] = useState<number | undefined>(undefined);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const inicial = deudaPreseleccionada ?? deudas[0] ?? null;
      setDeudaId(inicial?.id ?? "");
      setMonto(inicial?.pagoMinimoMensual || undefined);
      setFecha(new Date().toISOString().split("T")[0]);
      setNotas("");
    }
  }, [open, deudaPreseleccionada, deudas]);

  const deudaSeleccionada = deudas.find((d) => d.id === deudaId) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit || !deudaId) return;
    if (!monto || monto <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ deuda_id: deudaId, monto, fecha, notas: notas || undefined });
      onOpenChange(false);
    } catch {
      // Error is handled via mutator
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reportar Pago</DialogTitle>
            <DialogDescription>
              {deudaSeleccionada
                ? <>Se registrará un pago para la deuda <strong>{deudaSeleccionada.nombre}</strong>. Este monto se descontará automáticamente del saldo actual de la deuda en la base de datos.</>
                : "Selecciona la deuda a la que quieres registrarle un pago."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!deudaPreseleccionada && (
              <div className="grid gap-2">
                <Label htmlFor="deudaSelect">Deuda</Label>
                <Select value={deudaId} onValueChange={setDeudaId}>
                  <SelectTrigger id="deudaSelect"><SelectValue placeholder="Seleccionar deuda..." /></SelectTrigger>
                  <SelectContent>
                    {deudas.map((d) => <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="montoPago">Monto pagado</Label>
              <CurrencyInput id="montoPago" required value={monto} onChange={setMonto} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fechaPago">Fecha del pago</Label>
              <Input id="fechaPago" type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notasPago">Notas (opcional)</Label>
              <Textarea id="notasPago" placeholder="Referencia de pago..." value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !deudaId}>
              Registrar pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
