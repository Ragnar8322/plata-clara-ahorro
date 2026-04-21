import { Toaster } from "@/components/ui/toaster";
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

const queryClient = new QueryClient();

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
    deudas, addDeuda, updateDeuda, deleteDeuda,
    metas,
    categorias, addCategoria, updateCategoria, deleteCategoria,
    pagosDeuda, addPagoDeuda, updatePagoDeuda, deletePagoDeuda,
    presupuestos, addPresupuesto, deletePresupuesto,
    ingresos, addIngreso, updateIngreso, deleteIngreso,
    config, updateConfig,
    loading, configLoaded,
  } = useFinancialData();

  const now = useMemo(() => new Date(), []);
  const mesActual = useMemo(() => 
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  , [now]);

  const healthScore = useMemo(() => 
    calculateHealthScore(ingresos, deudas, metas, gastos, mesActual)
  , [ingresos, deudas, metas, gastos, mesActual]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </Layout>
    );
  }

  // Redirect to config if first time user (no config saved)
  if (!configLoaded) {
    return (
      <Layout>
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
            />
          } />
          <Route path="*" element={<Navigate to="/configuracion" replace />} />
        </Routes>
      </Layout>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ResumenPage gastos={gastos} deudas={deudas} metas={metas} config={config} presupuestos={presupuestos} ingresos={ingresos} />} />
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
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
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
);

export default App;
