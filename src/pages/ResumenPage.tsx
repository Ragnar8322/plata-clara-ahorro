import { useMemo } from "react";
import { Gasto, Deuda, Configuracion } from "@/types";
import { formatMoney } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell,
} from "recharts";

interface Props {
  gastos: Gasto[];
  deudas: Deuda[];
  config: Configuracion;
}

export default function ResumenPage({ gastos, deudas, config }: Props) {
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

  const margen = config.ingresoMensualNeto - totalGastosMes - totalMinimos;

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

  // Chart data
  const chartData = [
    { name: "Ingreso", valor: config.ingresoMensualNeto },
    { name: "Gastos", valor: totalGastosMes },
    { name: "Pagos deudas", valor: totalMinimos },
  ];
  const barColors = ["hsl(215, 70%, 48%)", "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)"];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Resumen</h2>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Ingreso mensual neto</p>
            <p className="text-xl font-bold">{formatMoney(config.ingresoMensualNeto, config)}</p>
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

      {/* Balance */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <p className="text-sm text-muted-foreground">
            Ingreso ({formatMoney(config.ingresoMensualNeto, config)}) − Gastos ({formatMoney(totalGastosMes, config)}) − Pagos mín. deudas ({formatMoney(totalMinimos, config)}) =
          </p>
          <p className={`text-2xl font-bold mt-1 ${margen >= 0 ? "text-success" : "text-destructive"}`}>
            {formatMoney(margen, config)} margen disponible
          </p>
        </CardContent>
      </Card>

      {/* Chart + lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Comparativa mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${config.monedaSimbolo}${(v / 1000000).toFixed(1)}M`} />
                <RTooltip formatter={(value: number) => formatMoney(value, config)} />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={barColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top lists */}
        <div className="space-y-4">
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
    </div>
  );
}
