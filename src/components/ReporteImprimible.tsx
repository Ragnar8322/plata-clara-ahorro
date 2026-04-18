import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Gasto, Deuda, Configuracion, MetaAhorro, PresupuestoCategoria, Ingreso } from "@/types";
import { formatMoney } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  gastos: Gasto[];
  deudas: Deuda[];
  metas: MetaAhorro[];
  presupuestos: PresupuestoCategoria[];
  ingresos: Ingreso[];
  config: Configuracion;
  healthScore: number;
}

export default function ReporteImprimible({ 
  gastos, deudas, metas, presupuestos, ingresos, config, healthScore 
}: Props) {
  const now = new Date();
  const mesActual = format(now, "MMMM yyyy", { locale: es });
  const mesKey = format(now, "yyyy-MM");

  const totalGastos = useMemo(() => 
    gastos.filter(g => g.fecha.startsWith(mesKey)).reduce((s, g) => s + g.monto, 0)
  , [gastos, mesKey]);

  const totalIngresos = useMemo(() => 
    ingresos.length > 0 ? ingresos.reduce((s, i) => s + i.monto, 0) : config.ingresoMensualNeto
  , [ingresos, config.ingresoMensualNeto]);

  const totalDeudas = useMemo(() => 
    deudas.filter(d => d.activa).reduce((s, d) => s + d.saldoActual, 0)
  , [deudas]);

  const totalPagosMin = useMemo(() => 
    deudas.filter(d => d.activa).reduce((s, d) => s + d.pagoMinimoMensual, 0)
  , [deudas]);

  const margen = totalIngresos - totalGastos - totalPagosMin;

  return (
    <div className="bg-white p-8 text-slate-900 min-h-screen print:p-0 print:m-0" id="reporte-financiero">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">🪙 Plata Clara</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Reporte Ejecutivo de Salud Financiera</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">{mesActual}</p>
          <p className="text-xs text-slate-400">Generado el {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        </div>
      </div>

      {/* Hero Section: Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1 border-2 border-primary/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Score de Salud</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2">
            <span className="text-6xl font-black text-primary">{healthScore}</span>
            <span className="text-sm font-bold mt-2 px-3 py-1 bg-primary/10 rounded-full text-primary">
              {healthScore >= 80 ? "Excelente" : healthScore >= 60 ? "Saludable" : healthScore >= 40 ? "Regular" : "Crítico"}
            </span>
          </CardContent>
        </Card>

        <Card className="col-span-2 border-none bg-slate-50 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">Balance Mensual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Ingresos Totales:</span>
              <span className="font-bold text-success">{formatMoney(totalIngresos, config)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Gastos Registrados:</span>
              <span className="font-bold text-destructive">-{formatMoney(totalGastos, config)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Obligaciones (Deudas):</span>
              <span className="font-bold text-destructive">-{formatMoney(totalPagosMin, config)}</span>
            </div>
            <Separator className="bg-slate-200" />
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold">Margen Disponible:</span>
              <span className={`text-xl font-black ${margen >= 0 ? "text-success" : "text-destructive"}`}>
                {formatMoney(margen, config)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Deudas */}
        <section>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-destructive rounded-full" />
            Resumen de Deudas
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Pasivo Total:</span>
              <span className="font-bold">{formatMoney(totalDeudas, config)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Deudas en curso:</span>
              <span className="font-bold">{deudas.filter(d => d.activa).length}</span>
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Próxima Deuda a Liquidar</p>
              {deudas.filter(d => d.activa).sort((a,b) => a.saldoActual - b.saldoActual)[0]?.nombre || "Ninguna"}
            </div>
          </div>
        </section>

        {/* Metas */}
        <section>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-success rounded-full" />
            Progreso de Metas
          </h3>
          <div className="space-y-4">
            {metas.filter(m => m.activa).slice(0, 3).map(m => (
              <div key={m.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium underline decoration-primary/30 decoration-2">{m.emoji} {m.nombre}</span>
                  <span className="font-bold">{Math.round((m.monto_actual/m.monto_objetivo)*100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(m.monto_actual/m.monto_objetivo)*100}%` }}
                  />
                </div>
              </div>
            ))}
            {metas.filter(m => m.activa).length === 0 && (
              <p className="text-sm italic text-slate-400">No hay metas activas registradas.</p>
            )}
          </div>
        </section>
      </div>

      {/* Footer Recommendations */}
      <div className="mt-12 p-6 bg-primary/5 rounded-2xl border-2 border-primary/10 break-inside-avoid">
        <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
          💡 Recomendaciones del Sistema
        </h4>
        <ul className="text-sm space-y-2 text-slate-700">
          {margen > 0 ? (
            <li>✅ Tienes un margen positivo de {formatMoney(margen, config)}. Considera aumentar tus aportes a metas de ahorro.</li>
          ) : (
            <li>⚠️ Tu flujo de caja es negativo. Revisa tus gastos variables para recuperar liquidez.</li>
          )}
          {deudas.some(d => d.tasaInteresAnual > 25) && (
            <li>🔴 Posees deudas con intereses altos ({">"}25%). Prioriza el pago de estas usando el método de Avalancha.</li>
          )}
          <li>✨ Recuerda registrar todos tus gastos diarios para mantener la precisión de este reporte.</li>
        </ul>
      </div>

      <div className="mt-16 text-center text-[10px] text-slate-300">
        Plata Clara - Tu Asesor Financiero Inteligente. www.plataclara.app
      </div>
    </div>
  );
}

