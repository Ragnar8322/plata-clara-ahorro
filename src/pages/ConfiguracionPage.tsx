import { useState } from "react";
import { Configuracion, EstrategiaOrden } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  config: Configuracion;
  onUpdate: (c: Configuracion) => void;
}

export default function ConfiguracionPage({ config, onUpdate }: Props) {
  const [ingreso, setIngreso] = useState(config.ingresoMensualNeto.toString());
  const [simbolo, setSimbolo] = useState(config.monedaSimbolo);
  const [nombreMoneda, setNombreMoneda] = useState(config.nombreMoneda);
  const [presupuestoDeudas, setPresupuestoDeudas] = useState(config.presupuestoMensualParaDeudas.toString());
  const [mesesMax, setMesesMax] = useState(config.mesesMaxProyeccion.toString());
  const [estrategia, setEstrategia] = useState<EstrategiaOrden>(config.estrategiaOrdenDeudas);

  const handleSave = () => {
    onUpdate({
      ...config,
      ingresoMensualNeto: Number(ingreso) || 0,
      monedaSimbolo: simbolo || "$",
      nombreMoneda: nombreMoneda || "COP",
      presupuestoMensualParaDeudas: Number(presupuestoDeudas) || 0,
      mesesMaxProyeccion: Number(mesesMax) || 36,
      estrategiaOrdenDeudas: estrategia,
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
          <div className="grid gap-4">
            <div>
              <Label>Ingreso mensual neto</Label>
              <Input type="number" min="0" value={ingreso} onChange={(e) => setIngreso(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Símbolo de moneda</Label>
                <Input value={simbolo} onChange={(e) => setSimbolo(e.target.value)} placeholder="$" />
              </div>
              <div>
                <Label>Nombre moneda</Label>
                <Input value={nombreMoneda} onChange={(e) => setNombreMoneda(e.target.value)} placeholder="COP" />
              </div>
            </div>
            <div>
              <Label>Presupuesto mensual para deudas</Label>
              <Input type="number" min="0" value={presupuestoDeudas} onChange={(e) => setPresupuestoDeudas(e.target.value)} />
            </div>
            <div>
              <Label>Meses máximos de proyección</Label>
              <Input type="number" min="1" max="120" value={mesesMax} onChange={(e) => setMesesMax(e.target.value)} />
            </div>
            <div>
              <Label>Estrategia por defecto</Label>
              <Select value={estrategia} onValueChange={(v) => setEstrategia(v as EstrategiaOrden)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SaldoAscendente">Bola de nieve (menor saldo primero)</SelectItem>
                  <SelectItem value="InteresDescendente">Avalancha (mayor tasa primero)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">Guardar configuración</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
