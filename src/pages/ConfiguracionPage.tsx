import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Configuracion, EstrategiaOrden } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect } from "react";

const configSchema = z.object({
  ingresoMensualNeto: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  monedaSimbolo: z.string().min(1, "El símbolo es obligatorio"),
  nombreMoneda: z.string().min(1, "El nombre de la moneda es obligatorio"),
  presupuestoMensualParaDeudas: z.coerce.number().min(0, "Debe ser mayor o igual a 0"),
  mesesMaxProyeccion: z.coerce.number().min(1, "Debe ser mayor a 0").max(120, "Máximo 120 meses"),
  estrategiaOrdenDeudas: z.enum(["SaldoAscendente", "InteresDescendente"] as const),
});

type FormValues = z.infer<typeof configSchema>;

interface Props {
  config: Configuracion;
  onUpdate: (c: Configuracion) => void;
}

export default function ConfiguracionPage({ config, onUpdate }: Props) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      ingresoMensualNeto: config.ingresoMensualNeto,
      monedaSimbolo: config.monedaSimbolo,
      nombreMoneda: config.nombreMoneda,
      presupuestoMensualParaDeudas: config.presupuestoMensualParaDeudas,
      mesesMaxProyeccion: config.mesesMaxProyeccion,
      estrategiaOrdenDeudas: config.estrategiaOrdenDeudas,
    },
  });

  useEffect(() => {
    reset({
      ingresoMensualNeto: config.ingresoMensualNeto,
      monedaSimbolo: config.monedaSimbolo,
      nombreMoneda: config.nombreMoneda,
      presupuestoMensualParaDeudas: config.presupuestoMensualParaDeudas,
      mesesMaxProyeccion: config.mesesMaxProyeccion,
      estrategiaOrdenDeudas: config.estrategiaOrdenDeudas,
    });
  }, [config, reset]);

  const onValidSubmit = (data: FormValues) => {
    onUpdate({
      ...config,
      ingresoMensualNeto: data.ingresoMensualNeto,
      monedaSimbolo: data.monedaSimbolo,
      nombreMoneda: data.nombreMoneda,
      presupuestoMensualParaDeudas: data.presupuestoMensualParaDeudas,
      mesesMaxProyeccion: data.mesesMaxProyeccion,
      estrategiaOrdenDeudas: data.estrategiaOrdenDeudas,
    });
    toast.success("Configuración guardada correctamente.");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Configuración</h2>
      <Card className="max-w-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Preferencias generales</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onValidSubmit)} className="grid gap-4">
            <div>
              <Label htmlFor="ingreso">Ingreso mensual neto</Label>
              <Input id="ingreso" type="number" min="0" step="0.01" {...register("ingresoMensualNeto")} />
              {errors.ingresoMensualNeto && <p className="text-xs text-destructive mt-1">{errors.ingresoMensualNeto.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="simbolo">Símbolo de moneda</Label>
                <Input id="simbolo" placeholder="$" {...register("monedaSimbolo")} />
                {errors.monedaSimbolo && <p className="text-xs text-destructive mt-1">{errors.monedaSimbolo.message}</p>}
              </div>
              <div>
                <Label htmlFor="nombreMoneda">Nombre moneda</Label>
                <Input id="nombreMoneda" placeholder="COP" {...register("nombreMoneda")} />
                {errors.nombreMoneda && <p className="text-xs text-destructive mt-1">{errors.nombreMoneda.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="presupuesto">Presupuesto mensual para deudas</Label>
              <Input id="presupuesto" type="number" min="0" step="0.01" {...register("presupuestoMensualParaDeudas")} />
              {errors.presupuestoMensualParaDeudas && <p className="text-xs text-destructive mt-1">{errors.presupuestoMensualParaDeudas.message}</p>}
            </div>

            <div>
              <Label htmlFor="meses">Meses máximos de proyección</Label>
              <Input id="meses" type="number" min="1" max="120" {...register("mesesMaxProyeccion")} />
              {errors.mesesMaxProyeccion && <p className="text-xs text-destructive mt-1">{errors.mesesMaxProyeccion.message}</p>}
            </div>

            <div>
              <Label>Estrategia por defecto</Label>
              <Controller
                name="estrategiaOrdenDeudas"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SaldoAscendente">Bola de nieve (menor saldo primero)</SelectItem>
                      <SelectItem value="InteresDescendente">Avalancha (mayor tasa primero)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.estrategiaOrdenDeudas && <p className="text-xs text-destructive mt-1">{errors.estrategiaOrdenDeudas.message}</p>}
            </div>

            <Button type="submit" className="w-full">Guardar configuración</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
