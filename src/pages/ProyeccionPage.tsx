import { useState, useMemo } from "react";
import { Deuda, Configuracion, EstrategiaOrden, ResultadoSimulacion } from "@/types";
import { simularBolaDeNieve } from "@/services/snowballCalculator";
import { formatMoney } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, Legend
} from "recharts";
import { HelpCircle, RefreshCw, PartyPopper, TrendingDown, PieChart } from "lucide-react";

interface Props {
  deudas: Deuda[];
  config: Configuracion;
}

export default function ProyeccionPage({ deudas, config }: Props) {
  const now = new Date();
  const [fechaInicio, setFechaInicio] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [mesesMax, setMesesMax] = useState(config.mesesMaxProyeccion.toString());
  const [estrategia, setEstrategia] = useState<EstrategiaOrden>(config.estrategiaOrdenDeudas);
  const [presupuesto, setPresupuesto] = useState(config.presupuestoMensualParaDeudas.toString());
  const [resultado, setResultado] = useState<ResultadoSimulacion | null>(null);

  const deudasActivas = useMemo(() => deudas.filter((d) => d.activa && d.saldoActual > 0), [deudas]);

  const calcular = () => {
    if (deudasActivas.length === 0) return;
    const res = simularBolaDeNieve(
      deudas,
      Number(presupuesto),
      Number(mesesMax),
      estrategia,
      fechaInicio
    );
    setResultado(res);
  };

  const totalMinimos = deudasActivas.reduce((s, d) => s + d.pagoMinimoMensual, 0);
  const presupuestoInsuficiente = Number(presupuesto) < totalMinimos;

  const dataGraficoBalance = useMemo(() => {
    if (!resultado) return [];
    return resultado.calendario.map(mes => {
      const saldoTotal = mes.pagos.reduce((sum, p) => sum + p.saldoFinal, 0);
      return {
        name: mes.fecha,
        Balance: saldoTotal,
      };
    });
  }, [resultado]);

  const dataGraficoIntereses = useMemo(() => {
    if (!resultado) return [];
    
    // Sumar por deuda
    const totales: Record<string, { capital: number; interes: number; nombre: string }> = {};
    
    resultado.calendario.forEach(mes => {
      mes.pagos.forEach(pago => {
        if (!totales[pago.deudaId]) {
          totales[pago.deudaId] = { capital: 0, interes: 0, nombre: pago.nombreDeuda };
        }
        totales[pago.deudaId].capital += pago.abonoCapital;
        totales[pago.deudaId].interes += pago.abonoInteres;
      });
    });

    return Object.values(totales).map(t => ({
      name: t.nombre,
      Capital: Math.round(t.capital),
      Intereses: Math.round(t.interes),
    }));
  }, [resultado]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Proyección de pagos</h2>

      {/* Config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Parámetros de simulación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Fecha inicio</Label>
              <Input type="month" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div>
              <Label>Meses máximos</Label>
              <Input type="number" min="1" max="120" value={mesesMax} onChange={(e) => setMesesMax(e.target.value)} />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Label>Estrategia</Label>
                <Tooltip>
                  <TooltipTrigger type="button"><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-[260px] text-xs">
                    <strong>Bola de nieve:</strong> Paga primero la deuda con menor saldo. Motiva ver deudas eliminadas rápido.<br />
                    <strong>Avalancha:</strong> Paga primero la de mayor tasa de interés. Ahorra más dinero a largo plazo.
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={estrategia} onValueChange={(v) => setEstrategia(v as EstrategiaOrden)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SaldoAscendente">Bola de nieve (menor saldo)</SelectItem>
                  <SelectItem value="InteresDescendente">Avalancha (mayor interés)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Presupuesto mensual deudas</Label>
              <Input type="number" min="0" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} />
              {presupuestoInsuficiente && (
                <p className="text-xs text-destructive mt-1">
                  El presupuesto es menor que los pagos mínimos ({formatMoney(totalMinimos, config)}).
                </p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={calcular} disabled={deudasActivas.length === 0}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Calcular proyección
            </Button>
            {deudasActivas.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">No hay deudas activas para simular.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {resultado && (
        <>
          {/* Summary */}
          <div className="flex flex-wrap gap-3">
            <Card className="flex-1 min-w-[180px]">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Meses simulados</p>
                <p className="text-xl font-bold">{resultado.mesesSimulados}</p>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[180px]">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total intereses pagados</p>
                <p className="text-xl font-bold text-destructive">{formatMoney(resultado.totalInteresesPagados, config)}</p>
              </CardContent>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Libre de deudas</p>
                {resultado.fechaLibreDeDeudas ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-success">{resultado.fechaLibreDeDeudas}</p>
                    <PartyPopper className="h-5 w-5 text-success" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No se alcanza en el rango simulado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de Proyección */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  Reducción de Deuda Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dataGraficoBalance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${config.monedaSimbolo}${(v / 1000).toFixed(0)}k`} />
                      <RTooltip formatter={(v: number) => formatMoney(v, config)} />
                      <Area 
                        type="monotone" 
                        dataKey="Balance" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorBalance)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Distribución de Pagos (Capital vs Interés)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataGraficoIntereses} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.2} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                      <RTooltip formatter={(v: number) => formatMoney(v, config)} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="Capital" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} barSize={20} />
                      <Bar dataKey="Intereses" stackId="a" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment order */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Orden recomendado de pago</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Deuda</TableHead>
                    <TableHead className="text-right">Saldo inicial</TableHead>
                    <TableHead className="text-right">Tasa %</TableHead>
                    <TableHead className="text-right">Pago mín.</TableHead>
                    <TableHead>Mes estimado de pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.ordenPago.map((d) => (
                    <TableRow key={d.deudaId}>
                      <TableCell className="font-bold text-primary">{d.prioridad}</TableCell>
                      <TableCell className="font-medium">{d.nombreDeuda}</TableCell>
                      <TableCell className="text-right">{formatMoney(d.saldoInicialSimulacion, config)}</TableCell>
                      <TableCell className="text-right">{d.tasaInteresAnual}%</TableCell>
                      <TableCell className="text-right">{formatMoney(d.pagoMinimoMensual, config)}</TableCell>
                      <TableCell>
                        {d.fechaEstimadaPago ? (
                          <Badge variant="default">Mes {d.mesEstimadoPago} ({d.fechaEstimadaPago})</Badge>
                        ) : (
                          <Badge variant="secondary">No pagada en el rango</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Monthly calendar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Calendario mensual de pagos</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10">Mes</TableHead>
                    {resultado.ordenPago.map((d) => (
                      <TableHead key={d.deudaId} colSpan={3} className="text-center border-l">
                        {d.nombreDeuda}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10"></TableHead>
                    {resultado.ordenPago.map((d) => (
                      <>
                        <TableHead key={`${d.deudaId}-pago`} className="text-right text-xs border-l">Pago</TableHead>
                        <TableHead key={`${d.deudaId}-int`} className="text-right text-xs">Interés</TableHead>
                        <TableHead key={`${d.deudaId}-sal`} className="text-right text-xs">Saldo</TableHead>
                      </>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.calendario.map((mes) => (
                    <TableRow key={mes.mesNumero}>
                      <TableCell className="sticky left-0 bg-card z-10 font-medium whitespace-nowrap">
                        {mes.fecha}
                      </TableCell>
                      {resultado.ordenPago.map((op) => {
                        const pago = mes.pagos.find((p) => p.deudaId === op.deudaId);
                        if (!pago) return <><TableCell className="border-l">-</TableCell><TableCell>-</TableCell><TableCell>-</TableCell></>;
                        return (
                          <>
                            <TableCell key={`${op.deudaId}-${mes.mesNumero}-p`} className="text-right text-xs border-l">
                              {pago.pagoTotal > 0 ? formatMoney(pago.pagoTotal, config) : "-"}
                            </TableCell>
                            <TableCell key={`${op.deudaId}-${mes.mesNumero}-i`} className="text-right text-xs text-muted-foreground">
                              {pago.abonoInteres > 0 ? formatMoney(pago.abonoInteres, config) : "-"}
                            </TableCell>
                            <TableCell key={`${op.deudaId}-${mes.mesNumero}-s`} className={`text-right text-xs ${pago.pagada ? "text-success font-medium" : ""}`}>
                              {pago.pagada ? "✓ Pagada" : formatMoney(pago.saldoFinal, config)}
                            </TableCell>
                          </>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
