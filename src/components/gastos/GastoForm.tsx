import { useState } from "react";
import { Gasto, CATEGORIAS_GASTO, METODOS_PAGO, TIPOS_GASTO, FRECUENCIAS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GastoFormProps {
  gastoEditar?: Gasto | null;
  onSubmit: (gasto: Omit<Gasto, "id"> & { id?: string }) => void;
  onCancel?: () => void;
}

export default function GastoForm({ gastoEditar, onSubmit, onCancel }: GastoFormProps) {
  const [fecha, setFecha] = useState(gastoEditar?.fecha || new Date().toISOString().split("T")[0]);
  const [categoria, setCategoria] = useState(gastoEditar?.categoria || "");
  const [descripcion, setDescripcion] = useState(gastoEditar?.descripcion || "");
  const [monto, setMonto] = useState(gastoEditar?.monto?.toString() || "");
  const [metodoPago, setMetodoPago] = useState(gastoEditar?.metodoPago || "");
  const [tipo, setTipo] = useState(gastoEditar?.tipo || "");
  const [frecuencia, setFrecuencia] = useState<string>(gastoEditar?.frecuencia || "Único");
  const [notas, setNotas] = useState(gastoEditar?.notas || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fecha) e.fecha = "La fecha es obligatoria";
    if (!categoria) e.categoria = "La categoría es obligatoria";
    if (!descripcion.trim()) e.descripcion = "La descripción es obligatoria";
    if (!monto || Number(monto) <= 0) e.monto = "El monto debe ser mayor a 0";
    if (!metodoPago) e.metodoPago = "El método de pago es obligatorio";
    if (!tipo) e.tipo = "El tipo es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...(gastoEditar ? { id: gastoEditar.id } : {}),
      fecha,
      categoria: categoria as Gasto["categoria"],
      descripcion: descripcion.trim(),
      monto: Number(monto),
      metodoPago: metodoPago as Gasto["metodoPago"],
      tipo: tipo as Gasto["tipo"],
      frecuencia: (frecuencia || "Único") as Gasto["frecuencia"],
      notas: notas.trim() || undefined,
    });
    if (!gastoEditar) {
      setDescripcion("");
      setMonto("");
      setNotas("");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">
          {gastoEditar ? "Editar gasto" : "Registrar nuevo gasto"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fecha">Fecha *</Label>
            <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            {errors.fecha && <p className="text-xs text-destructive mt-1">{errors.fecha}</p>}
          </div>
          <div>
            <Label>Categoría *</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS_GASTO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.categoria && <p className="text-xs text-destructive mt-1">{errors.categoria}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="desc">Descripción *</Label>
            <Input id="desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej.: Arriendo mensual" />
            {errors.descripcion && <p className="text-xs text-destructive mt-1">{errors.descripcion}</p>}
          </div>
          <div>
            <Label htmlFor="monto">Monto *</Label>
            <Input id="monto" type="number" min="0" step="1" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" />
            {errors.monto && <p className="text-xs text-destructive mt-1">{errors.monto}</p>}
          </div>
          <div>
            <Label>Método de pago *</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {METODOS_PAGO.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.metodoPago && <p className="text-xs text-destructive mt-1">{errors.metodoPago}</p>}
          </div>
          <div>
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {TIPOS_GASTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.tipo && <p className="text-xs text-destructive mt-1">{errors.tipo}</p>}
          </div>
          <div>
            <Label>Frecuencia</Label>
            <Select value={frecuencia} onValueChange={setFrecuencia}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FRECUENCIAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Notas adicionales..." />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit">{gastoEditar ? "Guardar cambios" : "Agregar gasto"}</Button>
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
