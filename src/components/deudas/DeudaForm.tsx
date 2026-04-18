import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

const deudaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  tipo: z.enum(TIPOS_DEUDA as [string, ...string[]], {
    required_error: "El tipo es obligatorio",
  }),
  entidad: z.string().min(1, "La entidad es obligatoria"),
  saldoInicial: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  saldoActual: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  tasaInteresAnual: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  pagoMinimoMensual: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  diaCorteOPago: z.coerce.number().min(1, "Entre 1 y 31").max(31, "Entre 1 y 31"),
  pagoExtraPlaneadoMensual: z.coerce.number().min(0).default(0),
  activa: z.boolean().default(true),
  notas: z.string().optional(),
}).refine(data => data.saldoActual <= data.saldoInicial, {
  message: "El saldo actual es mayor al saldo inicial",
  path: ["saldoActual"]
});

type FormValues = z.infer<typeof deudaSchema>;

interface Props {
  deudaEditar?: Deuda | null;
  onSubmit: (deuda: Omit<Deuda, "id"> & { id?: string }) => void;
  onCancel?: () => void;
}

export default function DeudaForm({ deudaEditar, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(deudaSchema),
    defaultValues: {
      nombre: "",
      tipo: undefined,
      entidad: "",
      saldoInicial: undefined as unknown as number,
      saldoActual: undefined as unknown as number,
      tasaInteresAnual: undefined as unknown as number,
      pagoMinimoMensual: undefined as unknown as number,
      diaCorteOPago: undefined as unknown as number,
      pagoExtraPlaneadoMensual: 0,
      activa: true,
      notas: "",
    },
  });

  useEffect(() => {
    if (deudaEditar) {
      reset({
        nombre: deudaEditar.nombre,
        tipo: deudaEditar.tipo,
        entidad: deudaEditar.entidad,
        saldoInicial: deudaEditar.saldoInicial,
        saldoActual: deudaEditar.saldoActual,
        tasaInteresAnual: deudaEditar.tasaInteresAnual,
        pagoMinimoMensual: deudaEditar.pagoMinimoMensual,
        diaCorteOPago: deudaEditar.diaCorteOPago,
        pagoExtraPlaneadoMensual: deudaEditar.pagoExtraPlaneadoMensual || 0,
        activa: deudaEditar.activa ?? true,
        notas: deudaEditar.notas || "",
      });
    } else {
      reset({
        nombre: "",
        tipo: undefined as any,
        entidad: "",
        saldoInicial: undefined as any,
        saldoActual: undefined as any,
        tasaInteresAnual: undefined as any,
        pagoMinimoMensual: undefined as any,
        diaCorteOPago: undefined as any,
        pagoExtraPlaneadoMensual: 0,
        activa: true,
        notas: "",
      });
    }
  }, [deudaEditar, reset]);

  const onValidSubmit = (data: FormValues) => {
    onSubmit({
      ...(deudaEditar ? { id: deudaEditar.id } : {}),
      nombre: data.nombre,
      tipo: data.tipo as Deuda["tipo"],
      entidad: data.entidad,
      saldoInicial: data.saldoInicial,
      saldoActual: data.saldoActual,
      tasaInteresAnual: data.tasaInteresAnual,
      pagoMinimoMensual: data.pagoMinimoMensual,
      diaCorteOPago: data.diaCorteOPago,
      pagoExtraPlaneadoMensual: data.pagoExtraPlaneadoMensual,
      activa: data.activa,
      notas: data.notas || undefined,
    });
    if (!deudaEditar) {
      reset({
        nombre: "", entidad: "", saldoInicial: undefined as any, saldoActual: undefined as any,
        tasaInteresAnual: undefined as any, pagoMinimoMensual: undefined as any, diaCorteOPago: undefined as any,
        pagoExtraPlaneadoMensual: 0, activa: true, notas: ""
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{deudaEditar ? "Editar deuda" : "Registrar nueva deuda"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onValidSubmit)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" placeholder="Ej.: Tarjeta Banco X" {...register("nombre")} />
            {errors.nombre && <p className="text-xs text-destructive mt-1">{errors.nombre.message}</p>}
          </div>

          <div>
            <Label>Tipo *</Label>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_DEUDA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tipo && <p className="text-xs text-destructive mt-1">{errors.tipo.message}</p>}
          </div>

          <div>
            <Label htmlFor="entidad">Entidad *</Label>
            <Input id="entidad" placeholder="Banco o entidad" {...register("entidad")} />
            {errors.entidad && <p className="text-xs text-destructive mt-1">{errors.entidad.message}</p>}
          </div>

          <div>
            <Label htmlFor="saldoInicial">Saldo inicial *</Label>
            <Input id="saldoInicial" type="number" min="0" step="0.01" {...register("saldoInicial")} />
            {errors.saldoInicial && <p className="text-xs text-destructive mt-1">{errors.saldoInicial.message}</p>}
          </div>

          <div>
            <Label htmlFor="saldoActual">Saldo actual *</Label>
            <Input id="saldoActual" type="number" min="0" step="0.01" {...register("saldoActual")} />
            {errors.saldoActual && <p className="text-xs text-warning mt-1">{errors.saldoActual.message}</p>}
          </div>

          <div>
            <div className="flex items-center gap-1">
              <Label htmlFor="tasaInteres">Tasa interés anual (%) *</Label>
              <Tooltip>
                <TooltipTrigger type="button"><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-[220px] text-xs">Porcentaje anual efectivo. Ej.: 28.5 para 28.5% E.A.</TooltipContent>
              </Tooltip>
            </div>
            <Input id="tasaInteres" type="number" min="0" step="0.01" placeholder="Ej.: 28.5" {...register("tasaInteresAnual")} />
            {errors.tasaInteresAnual && <p className="text-xs text-destructive mt-1">{errors.tasaInteresAnual.message}</p>}
          </div>

          <div>
            <Label htmlFor="pagoMinimo">Pago mínimo mensual *</Label>
            <Input id="pagoMinimo" type="number" min="0" step="0.01" {...register("pagoMinimoMensual")} />
            {errors.pagoMinimoMensual && <p className="text-xs text-destructive mt-1">{errors.pagoMinimoMensual.message}</p>}
          </div>

          <div>
            <Label htmlFor="diaCorte">Día de corte/pago *</Label>
            <Input id="diaCorte" type="number" min="1" max="31" step="1" {...register("diaCorteOPago")} />
            {errors.diaCorteOPago && <p className="text-xs text-destructive mt-1">{errors.diaCorteOPago.message}</p>}
          </div>

          <div>
            <Label htmlFor="pagoExtra">Pago extra planeado mensual</Label>
            <Input id="pagoExtra" type="number" min="0" step="0.01" {...register("pagoExtraPlaneadoMensual")} />
            {errors.pagoExtraPlaneadoMensual && <p className="text-xs text-destructive mt-1">{errors.pagoExtraPlaneadoMensual.message}</p>}
          </div>

          <div className="flex items-center gap-2 self-end pb-1 lg:col-span-3">
            <Controller
              name="activa"
              control={control}
              render={({ field }) => (
                <Checkbox id="activa" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="activa" className="cursor-pointer">Deuda activa</Label>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="notasD">Notas (opcional)</Label>
            <Textarea id="notasD" rows={2} {...register("notas")} />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
            <Button type="submit">{deudaEditar ? "Guardar cambios" : "Agregar deuda"}</Button>
            {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
