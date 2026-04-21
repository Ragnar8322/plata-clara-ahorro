import { Gasto, Deuda, Configuracion, MetaAhorro, PresupuestoCategoria, Ingreso } from "@/types";
import { formatMoney } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Area, AreaChart
} from "recharts";
import { AlertCircle, Target, TrendingUp, ShieldCheck, Activity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMemo } from "react";
import { calculateHealthScore } from "@/lib/financialMetrics";

interface Props {
  gastos: Gasto[];
  deudas: Deuda[];
  metas?: MetaAhorro[];
  presupuestos?: PresupuestoCategoria[];
  ingresos?: Ingreso[];
  config: Configuracion;
}

export default function ResumenPage({ gastos, deudas, metas = [], presupuestos = [], ingresos = [], config }: Props) {
  const now = new Date();
  const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const gastosMesActual = useMemo(
    () => gastos.filter((g) => g.fecha.startsWith(mesActual)),
    [gastos, mesActual]
  );

  const totalGastosMes = useMemo(
    () => gastosMesActual.reduce((s, g) => s + g.monto, 0),
    [gastosMesActual]
  );

  const deudasActivas = useMemo(() => deudas.filter((d) => d.activa), [deudas]);
  const totalDeudas = useMemo(() => deudasActivas.reduce((s, d) => s + d.saldoActual, 0), [deudasActivas]);
  const totalMinimos = useMemo(() => deudasActivas.reduce((s, d) => s + d.pagoMinimoMensual, 0), [deudasActivas]);

  const ingresoMensualTotal = useMemo(() => {
    if (ingresos.length > 0) {
      return ingresos.reduce((sum, ing) => sum + ing.monto, 0);
    }
    return config.ingresoMensualNeto;
  }, [ingresos, config.ingresoMensualNeto]);

  const margen = ingresoMensualTotal - totalGastosMes - totalMinimos;

  const metasActivas = useMemo(() => metas.filter((m) => m.activa), [metas]);
  const progresoMetas = useMemo(() => {
    if (metasActivas.length === 0) return 0;
    const totalActual = metasActivas.reduce((s, m) => s + m.monto_actual, 0);
    const totalObjetivo = metasActivas.reduce((s, m) => s + m.monto_objetivo, 0);
    return totalObjetivo > 0 ? (totalActual / totalObjetivo) : 0;
  }, [metasActivas]);

  const healthScore = useMemo(() => 
    calculateHealthScore(ingresos, deudas, metas, gastos, mesActual)
  , [ingresos, deudas, metas, gastos, mesActual]);

  let scoreLabel = "Crítico";
  let scoreColor = "bg-destructive";
  let scoreTextClass = "text-destructive";

  if (healthScore >= 80) {
    scoreLabel = "Excelente";
    scoreColor = "bg-success";
    scoreTextClass = "text-success";
  } else if (healthScore >= 60) {
    scoreLabel = "Saludable";
    scoreColor = "bg-primary";
    scoreTextClass = "text-primary";
  } else if (healthScore >= 40) {
    scoreLabel = "Regular";
    scoreColor = "bg-warning";
    scoreTextClass = "text-warning";
  }

  // Alertas de presupuesto
  const alertasPresupuesto = useMemo(() => {
    if (!presupuestos.length) return [];
    
    // Totales por categoría mes actual
    const totales: Record<string, number> = {};
    gastosMesActual.forEach(g => {
      totales[g.categoria] = (totales[g.categoria] || 0) + g.monto;
    });

    return presupuestos.map(p => {
      const gastado = totales[p.categoria] || 0;
      const porcentaje = p.limite_mensual > 0 ? (gastado / p.limite_mensual) : 0;
      return {
        ...p,
        gastado,
        porcentaje
      };
    }).filter(a => a.porcentaje >= 0.8) // Solo mostrar alertas del 80% o más
      .sort((a, b) => b.porcentaje - a.porcentaje);
  }, [gastosMesActual, presupuestos]);

  // Top 3 categories
  const topCategorias = useMemo(() => {
    const map: Record<string, number> = {};
    gastosMesActual.forEach((g) => {
      map[g.categoria] = (map[g.categoria] || 0) + g.monto;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [gastosMesActual]);

  // Top 3 debts by balance
  const topDeudas = useMemo(
    () => [...deudasActivas].sort((a, b) => b.saldoActual - a.saldoActual).slice(0, 3),
    [deudasActivas]
  );

  // Chart data (Comparativa)
  const chartData = [
    { name: "Ingreso", valor: ingresoMensualTotal },
    { name: "Gastos", valor: totalGastosMes },
    { name: "Pagos deudas", valor: totalMinimos },
  ];
  const barColors = ["hsl(215, 70%, 48%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)"];

  // Tendencia Histórica de Gastos (Últimos 6 meses)
  const tendenciaGastos = useMemo(() => {
    const map: Record<string, number> = {};
    const d = new Date();
    d.setDate(1);
    
    // Inicializar últimos 6 meses en 0
    for(let i=5; i>=0; i--) {
      const past = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, "0")}`;
      map[key] = 0;
    }

    gastos.forEach(g => {
      const key = g.fecha.substring(0, 7); // yyyy-mm
      if (map[key] !== undefined) {
        map[key] += g.monto;
      }
    });

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    return Object.entries(map).map(([key, val]) => {
      const [year, month] = key.split("-");
      return {
        key,
        name: monthNames[parseInt(month) - 1],
        Gastos: val
      }
    });
  }, [gastos]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Resumen</h2>

      {/* Alertas de Presupuesto */}
      {alertasPresupuesto.length > 0 && (
        <div className="space-y-3">
          {alertasPresupuesto.map(alerta => {
            const esExcedido = alerta.porcentaje >= 1;
            return (
              <Alert key={alerta.id} variant={esExcedido ? "destructive" : "default"} className={esExcedido ? "" : "border-warning bg-warning/10 text-warning-foreground"}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">
                  {esExcedido ? "Presupuesto Excedido" : "Alerta de Presupuesto"} en {alerta.categoria}
                </AlertTitle>
                <AlertDescription className="flex flex-col gap-1">
                  <span>
                    Has gastado {formatMoney(alerta.gastado, config)} de un límite de {formatMoney(alerta.limite_mensual, config)}.
                  </span>
                  <Progress 
                    value={Math.min(alerta.porcentaje * 100, 100)} 
                    className="h-2 mt-1"
                    indicatorColor={esExcedido ? "bg-destructive" : "bg-warning"}
                  />
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Saldo de Salud Financiera */}
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-background to-background shadow-lg">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative flex items-center justify-center">
              <svg className="h-32 w-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted/10"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * healthScore) / 100}
                  className={`${scoreTextClass} transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${scoreTextClass}`}>{healthScore}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Score</span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className={`h-5 w-5 ${scoreTextClass}`} />
                  Estado: {scoreLabel}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu salud financiera está basada en tu capacidad de ahorro, nivel de endeudamiento y progreso de metas.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-[10px] uppercase text-muted-foreground">Ahorro</p>
                  <p className="font-bold text-sm">{margen > 0 ? "✓ OK" : "⚠ BAJO"}</p>
                </div>
                <div className="p-2 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-[10px] uppercase text-muted-foreground">Deuda</p>
                  <p className="font-bold text-sm">{ingresoMensualTotal > 0 && totalMinimos/ingresoMensualTotal < 0.3 ? "✓ BAJA" : "⚠ ALTA"}</p>
                </div>
                <div className="p-2 bg-background/50 rounded-lg border border-border/50">
                  <p className="text-[10px] uppercase text-muted-foreground">Metas</p>
                  <p className="font-bold text-sm">{metasActivas.length > 0 ? "✓ ACTIVA" : "⚠ NINGUNA"}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <p className="text-sm text-muted-foreground">
            Ingreso ({formatMoney(ingresoMensualTotal, config)}) − Gastos ({formatMoney(totalGastosMes, config)}) − Pagos mín. deudas ({formatMoney(totalMinimos, config)}) =
          </p>
          <p className={`text-2xl font-bold mt-1 ${margen >= 0 ? "text-success" : "text-destructive"}`}>
            {formatMoney(margen, config)} margen disponible
          </p>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Ingreso mensual total</p>
            <p className="text-xl font-bold">{formatMoney(ingresoMensualTotal, config)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Gastos del mes</p>
            <p className="text-xl font-bold">{formatMoney(totalGastosMes, config)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total deudas activas</p>
            <p className="text-xl font-bold">{formatMoney(totalDeudas, config)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Pagos mínimos mensuales</p>
            <p className="text-xl font-bold">{formatMoney(totalMinimos, config)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tendencias y Comparativa */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart Tendencia */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Histórico de Gastos (6 meses)</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Evolución de tus gastos mensuales</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={tendenciaGastos} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${config.monedaSimbolo}${(v / 1000).toFixed(0)}k`} />
                <RTooltip formatter={(value: number) => formatMoney(value, config)} />
                <Area 
                  type="monotone" 
                  dataKey="Gastos" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorGastos)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart Comparativa */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Comparativa actual</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Ingresos vs Salidas (Mes actual)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${config.monedaSimbolo}${(v / 1000).toFixed(0)}k`} />
                <RTooltip formatter={(value: number) => formatMoney(value, config)} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={barColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 3 categorías de gasto</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategorias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin gastos este mes.</p>
            ) : (
              <div className="space-y-2">
                {topCategorias.map(([cat, val]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span>{cat}</span>
                    <span className="font-medium">{formatMoney(val, config)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top 3 deudas por saldo</CardTitle>
          </CardHeader>
          <CardContent>
            {topDeudas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin deudas activas.</p>
            ) : (
              <div className="space-y-2">
                {topDeudas.map((d) => (
                  <div key={d.id} className="flex justify-between text-sm">
                    <span>{d.nombre}</span>
                    <span className="font-medium">{formatMoney(d.saldoActual, config)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
