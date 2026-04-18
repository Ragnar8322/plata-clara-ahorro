import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Configuracion, CategoriaPersonalizada } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect } from "react";
import CategoriasManager from "@/components/configuracion/CategoriasManager";
import PresupuestosManager from "@/components/configuracion/PresupuestosManager";
import IngresosManager from "@/components/configuracion/IngresosManager";
import { PresupuestoCategoria, Ingreso, Gasto, Deuda } from "@/types";
import { exportToCSV } from "@/lib/exportUtils";
import { Download, Database } from "lucide-react";

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
  categorias?: CategoriaPersonalizada[];
  addCategoria?: (cat: Omit<CategoriaPersonalizada, "id" | "user_id" | "created_at">) => Promise<any>;
  deleteCategoria?: (id: string) => Promise<any>;
  presupuestos?: PresupuestoCategoria[];
  onSavePresupuesto?: (pres: Omit<PresupuestoCategoria, "id" | "user_id" | "created_at" | "updated_at">) => Promise<any>;
  onDeletePresupuesto?: (id: string) => Promise<any>;
  ingresos?: Ingreso[];
  onAddIngreso?: (ing: Omit<Ingreso, "id" | "user_id" | "created_at">) => Promise<any>;
  onDeleteIngreso?: (id: string) => Promise<any>;
  gastos?: Gasto[];
  deudas?: Deuda[];
}

export default function ConfiguracionPage({ 
  config, onUpdate, categorias = [], addCategoria, deleteCategoria,
  presupuestos = [], onSavePresupuesto, onDeletePresupuesto,
  ingresos = [], onAddIngreso, onDeleteIngreso,
  gastos = [], deudas = []
}: Props) {
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
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="">
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

        {addCategoria && deleteCategoria && (
          <CategoriasManager 
            categorias={categorias} 
            onAdd={addCategoria} 
            onDelete={deleteCategoria} 
          />
        )}

        {onSavePresupuesto && onDeletePresupuesto && (
          <div className="md:col-span-2">
            <PresupuestosManager
              categorias={categorias}
              presupuestos={presupuestos}
              config={config}
              onSave={onSavePresupuesto}
              onDelete={onDeletePresupuesto}
            />
          </div>
        )}

        {onAddIngreso && onDeleteIngreso && (
          <div className="md:col-span-2">
            <IngresosManager
              ingresos={ingresos}
              config={config}
              onAdd={onAddIngreso}
              onDelete={onDeleteIngreso}
            />
          </div>
        )}

        {/* Gestión de Datos */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Gestión de Datos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button variant="outline" onClick={() => exportToCSV(gastos, "gastos")} disabled={gastos.length === 0}>
                  <Download className="h-4 w-4 mr-2" /> Exportar Gastos
                </Button>
                <Button variant="outline" onClick={() => exportToCSV(deudas, "deudas")} disabled={deudas.length === 0}>
                  <Download className="h-4 w-4 mr-2" /> Exportar Deudas
                </Button>
                <Button variant="outline" onClick={() => exportToCSV(ingresos, "ingresos")} disabled={ingresos.length === 0}>
                  <Download className="h-4 w-4 mr-2" /> Exportar Ingresos
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                La exportación se realizará en formato CSV compatible con Excel y Google Sheets.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
