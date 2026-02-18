import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useFinancialData } from "@/hooks/useFinancialData";
import Layout from "@/components/Layout";
import ResumenPage from "@/pages/ResumenPage";
import GastosPage from "@/pages/GastosPage";
import DeudasPage from "@/pages/DeudasPage";
import ProyeccionPage from "@/pages/ProyeccionPage";
import ConfiguracionPage from "@/pages/ConfiguracionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const {
    gastos, addGasto, updateGasto, deleteGasto,
    deudas, addDeuda, updateDeuda, deleteDeuda,
    config, updateConfig,
  } = useFinancialData();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ResumenPage gastos={gastos} deudas={deudas} config={config} />} />
        <Route path="/gastos" element={<GastosPage gastos={gastos} config={config} onAdd={addGasto} onUpdate={updateGasto} onDelete={deleteGasto} />} />
        <Route path="/deudas" element={<DeudasPage deudas={deudas} config={config} onAdd={addDeuda} onUpdate={updateDeuda} onDelete={deleteDeuda} />} />
        <Route path="/proyeccion" element={<ProyeccionPage deudas={deudas} config={config} />} />
        <Route path="/configuracion" element={<ConfiguracionPage config={config} onUpdate={updateConfig} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
