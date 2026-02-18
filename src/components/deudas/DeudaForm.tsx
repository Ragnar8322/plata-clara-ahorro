import { useState } from "react";
import { Deuda, TIPOS_DEUDA } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface Props {
  deudaEditar?: Deuda | null;
  onSubmit: (deuda: Omit<Deuda, "id"> & { id?: string }) => void;
  onCancel?: () => void;
}

export default function DeudaForm({ deudaEditar, onSubmit, onCancel }: Props) {
  const [nombre, setNombre] = useState(deudaEditar?.nombre || "");
  const [tipo, setTipo] = useState(deudaEditar?.tipo || "");
  const [entidad, setEntidad] = useState(deudaEditar?.entidad || "");
  const [saldoInicial, setSaldoInicial] = useState(deudaEditar?.saldoInicial?.toString() || "");
  const [saldoActual, setSaldoActual] = useState(deudaEditar?.saldoActual?.toString() || "");
  const [tasaInteres, setTasaInteres] = useState(deudaEditar?.tasaInteresAnual?.toString() || "");
  const [pagoMinimo, setPagoMinimo] = useState(deudaEditar?.pagoMinimoMensual?.toString() || "");
  const [diaCorte, setDiaCorte] = useState(deudaEditar?.diaCorteOPago?.toString() || "");
  const [pagoExtra, setPagoExtra] = useState(deudaEditar?.pagoExtraPlaneadoMensual?.toString() || "0");
  const [activa, setActiva] = useState(deudaEditar?.activa ?? true);
  const [notas, setNotas] = useState(deudaEditar?.notas || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  const validate = () => {
    const e: Record<string, string> = {};
    const w: string[] = [];
    if (!nombre.trim()) e.nombre = "Obligatorio";
    if (!tipo) e.tipo = "Obligatorio";
    if (!entidad.trim()) e.entidad = "Obligatorio";
    if (!saldoInicial || Number(saldoInicial) < 0) e.saldoInicial = "Debe ser >= 0";
    if (!saldoActual || Number(saldoActual) < 0) e.saldoActual = "Debe ser >= 0";
    if (!tasaInteres || Number(tasaInteres) < 0) e.tasaInteres = "Debe ser >= 0";
    if (!pagoMinimo || Number(pagoMinimo) < 0) e.pagoMinimo = "Debe ser >= 0";
    if (!diaCorte || Number(diaCorte) < 1 || Number(diaCorte) > 31) e.diaCorte = "Entre 1 y 31";
    if (Number(saldoActual) > Number(saldoInicial)) {
      w.push("El saldo actual es mayor al saldo inicial.");
    }
    setErrors(e);
    setWarnings(w);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...(deudaEditar ? { id: deudaEditar.id } : {}),
      nombre: nombre.trim(),
      tipo: tipo as Deuda["tipo"],
      entidad: entidad.trim(),
      saldoInicial: Number(saldoInicial),
      saldoActual: Number(saldoActual),
      tasaInteresAnual: Number(tasaInteres),
      pagoMinimoMensual: Number(pagoMinimo),
      diaCorteOPago: Number(diaCorte),
      pagoExtraPlaneadoMensual: Number(pagoExtra) || 0,
      activa,
      notas: notas.trim() || undefined,
    });
    if (!deudaEditar) {
      setNombre(""); setEntidad(""); setSaldoInicial(""); setSaldoActual("");
      setTasaInteres(""); setPagoMinimo(""); setDiaCorte(""); setPagoExtra("0"); setNotas("");
    }
  };

  const field = (label: string, id: string, value: string, onChange: (v: string) => void, opts?: { type?: string; placeholder?: string; min?: string; max?: string; tooltip?: string }) => (
    <div>
      <div className="flex items-center gap-1">
        <Label htmlFor={id}>{label} *</Label>
        {opts?.tooltip && (
          <Tooltip>
            <TooltipTrigger type="button"><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent className="max-w-[220px] text-xs">{opts.tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <Input id={id} type={opts?.type || "text"} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={opts?.placeholder} min={opts?.min} max={opts?.max} step="any" />
      {errors[id] && <p className="text-xs text-destructive mt-1">{errors[id]}</p>}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{deudaEditar ? "Editar deuda" : "Registrar nueva deuda"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {field("Nombre", "nombre", nombre, setNombre, { placeholder: "Ej.: Tarjeta Banco X" })}
          <div>
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {TIPOS_DEUDA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.tipo && <p className="text-xs text-destructive mt-1">{errors.tipo}</p>}
          </div>
          {field("Entidad", "entidad", entidad, setEntidad, { placeholder: "Banco o entidad" })}
          {field("Saldo inicial", "saldoInicial", saldoInicial, setSaldoInicial, { type: "number", min: "0" })}
          {field("Saldo actual", "saldoActual", saldoActual, setSaldoActual, { type: "number", min: "0" })}
          {field("Tasa interés anual (%)", "tasaInteres", tasaInteres, setTasaInteres, {
            type: "number", min: "0", placeholder: "Ej.: 28.5",
            tooltip: "Porcentaje anual efectivo. Ej.: 28.5 para 28.5% E.A."
          })}
          {field("Pago mínimo mensual", "pagoMinimo", pagoMinimo, setPagoMinimo, { type: "number", min: "0" })}
          {field("Día de corte/pago", "diaCorte", diaCorte, setDiaCorte, { type: "number", min: "1", max: "31" })}
          <div>
            <Label htmlFor="pagoExtra">Pago extra planeado mensual</Label>
            <Input id="pagoExtra" type="number" min="0" value={pagoExtra} onChange={(e) => setPagoExtra(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 self-end pb-1">
            <Checkbox id="activa" checked={activa} onCheckedChange={(v) => setActiva(!!v)} />
            <Label htmlFor="activa" className="cursor-pointer">Deuda activa</Label>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="notasD">Notas (opcional)</Label>
            <Textarea id="notasD" value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
          </div>
          {warnings.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-warning">{w}</p>
              ))}
            </div>
          )}
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
            <Button type="submit">{deudaEditar ? "Guardar cambios" : "Agregar deuda"}</Button>
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
