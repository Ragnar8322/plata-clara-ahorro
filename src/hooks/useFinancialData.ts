import { useState, useCallback } from "react";
import { Gasto, Deuda, Configuracion } from "@/types";
import {
  loadGastos, saveGastos, loadDeudas, saveDeudas,
  loadConfiguracion, saveConfiguracion, newGastoId, newDeudaId,
} from "@/services/storage";

export function useFinancialData() {
  const [gastos, setGastos] = useState<Gasto[]>(() => loadGastos());
  const [deudas, setDeudas] = useState<Deuda[]>(() => loadDeudas());
  const [config, setConfig] = useState<Configuracion>(() => loadConfiguracion());

  // Gastos
  const addGasto = useCallback((gasto: Omit<Gasto, "id">) => {
    const nuevo = { ...gasto, id: newGastoId() };
    setGastos((prev) => {
      const next = [...prev, nuevo];
      saveGastos(next);
      return next;
    });
  }, []);

  const updateGasto = useCallback((gasto: Gasto) => {
    setGastos((prev) => {
      const next = prev.map((g) => (g.id === gasto.id ? gasto : g));
      saveGastos(next);
      return next;
    });
  }, []);

  const deleteGasto = useCallback((id: string) => {
    setGastos((prev) => {
      const next = prev.filter((g) => g.id !== id);
      saveGastos(next);
      return next;
    });
  }, []);

  // Deudas
  const addDeuda = useCallback((deuda: Omit<Deuda, "id">) => {
    const nueva = { ...deuda, id: newDeudaId() };
    setDeudas((prev) => {
      const next = [...prev, nueva];
      saveDeudas(next);
      return next;
    });
  }, []);

  const updateDeuda = useCallback((deuda: Deuda) => {
    setDeudas((prev) => {
      const next = prev.map((d) => (d.id === deuda.id ? deuda : d));
      saveDeudas(next);
      return next;
    });
  }, []);

  const deleteDeuda = useCallback((id: string) => {
    setDeudas((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveDeudas(next);
      return next;
    });
  }, []);

  // Config
  const updateConfig = useCallback((newConfig: Configuracion) => {
    setConfig(newConfig);
    saveConfiguracion(newConfig);
  }, []);

  return {
    gastos, addGasto, updateGasto, deleteGasto,
    deudas, addDeuda, updateDeuda, deleteDeuda,
    config, updateConfig,
  };
}
