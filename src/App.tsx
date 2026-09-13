import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMemo } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useFinancialData } from "@/hooks/useFinancialData";
import { calculateHealthScore } from "@/lib/financialMetrics";
import Layout from "@/components/Layout";
import ResumenPage from "@/pages/ResumenPage";
import ReporteImprimible from "@/components/ReporteImprimible";
import GastosPage from "@/pages/GastosPage";
import DeudasPage from "@/pages/DeudasPage";
import ProyeccionPage from "@/pages/ProyeccionPage";
import ConfiguracionPage from "@/pages/ConfiguracionPage";
import MetasPage from "@/pages/MetasPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Sin staleTime, las 8 consultas se recargaban cada vez que la ventana recuperaba el foco.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

function ProtectedRoutes() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppContent />;
}

function AppContent() {
  const {
    gastos, addGasto, updateGasto, deleteGasto,
    deudas, addDeuda, updateDeuda, deleteDeuda, reconocerMoraDeuda,
    metas,
    categorias, addCategoria, updateCategoria, deleteCategoria,
    pagosDeuda, addPagoDeuda, updatePagoDeuda, deletePagoDeuda,
    presupuestos, addPresupuesto, deletePresupuesto,
    ingresos, addIngreso, updateIngreso, deleteIngreso,
    config, updateConfig,
    loading, configLoaded, configError,
  } = useFinancialData();

  const now = useMemo(() => new Date(), []);
  const mesActual = useMemo(() => 
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  , [now]);

  const healthScore = useMemo(() => 
    calculateHealthScore(ingresos, deudas, metas, gastos, mesActual, config.ingresoMensualNeto)
  , [ingresos, deudas, metas, gastos, mesActual, config.ingresoMensualNeto]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </Layout>
    );
  }

  // No se pudo leer la configuración. Sin esta rama sería indistinguible de un usuario nuevo y
  // se mostraría el alta inicial en blanco, desde donde guardar sobrescribe la configuración real.
  if (configError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="font-medium">No pudimos cargar tu configuración.</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Tus datos siguen guardados. Revisa tu conexión y vuelve a intentarlo; no modifiques nada
            hasta que carguen para no sobrescribirlos.
          </p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </Layout>
    );
  }

  // Redirect to config if first time user (no config saved)
  if (!configLoaded) {
    return (
      <Layout deudas={deudas} onAddPago={addPagoDeuda}>
        <Routes>
          <Route path="/configuracion" element={
            <ConfiguracionPage
              config={config}
              onUpdate={updateConfig}
              categorias={categorias}
              addCategoria={addCategoria}
              deleteCategoria={deleteCategoria}
              presupuestos={presupuestos}
              onSavePresupuesto={addPresupuesto}
              onDeletePresupuesto={deletePresupuesto}
              ingresos={ingresos}
              onAddIngreso={addIngreso}
              onDeleteIngreso={deleteIngreso}
              gastos={gastos}
              deudas={deudas}
            />
          } />
          <Route path="*" element={<Navigate to="/configuracion" replace />} />
        </Routes>
      </Layout>
    );
  }

  return (
    <Layout deudas={deudas} onAddPago={addPagoDeuda}>
      <Routes>
        <Route path="/" element={<ResumenPage gastos={gastos} deudas={deudas} metas={metas} config={config} presupuestos={presupuestos} ingresos={ingresos} pagos={pagosDeuda} onUpdateDeuda={updateDeuda} onReconocerMora={(id, hasta) => reconocerMoraDeuda({ id, hasta })} />} />
        <Route path="/gastos" element={<GastosPage gastos={gastos} config={config} onAdd={addGasto} onUpdate={updateGasto} onDelete={deleteGasto} categorias={categorias} />} />
        <Route path="/deudas" element={<DeudasPage deudas={deudas} pagos={pagosDeuda} config={config} onAdd={addDeuda} onUpdate={updateDeuda} onDelete={deleteDeuda} onAddPago={addPagoDeuda} onDeletePago={deletePagoDeuda} />} />
        <Route path="/metas" element={<MetasPage />} />
        <Route path="/proyeccion" element={<ProyeccionPage deudas={deudas} config={config} />} />
        <Route path="/configuracion" element={
          <ConfiguracionPage 
            config={config} 
            onUpdate={updateConfig} 
            categorias={categorias} 
            addCategoria={addCategoria} 
            deleteCategoria={deleteCategoria}
            presupuestos={presupuestos}
            onSavePresupuesto={addPresupuesto}
            onDeletePresupuesto={deletePresupuesto}
            ingresos={ingresos}
            onAddIngreso={addIngreso}
            onDeleteIngreso={deleteIngreso}
            gastos={gastos}
            deudas={deudas}
          />
        } />
        <Route path="/reporte" element={
          <ReporteImprimible
            gastos={gastos}
            deudas={deudas}
            metas={metas}
            presupuestos={presupuestos}
            ingresos={ingresos}
            pagos={pagosDeuda}
            config={config}
            healthScore={healthScore}
          />
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
