import { useState, useCallback, useEffect } from "react";
import { Gasto, Deuda, Configuracion } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  loadGastos, saveGasto, updateGasto as updateGastoDb, deleteGasto as deleteGastoDb,
  loadDeudas, saveDeuda, updateDeuda as updateDeudaDb, deleteDeuda as deleteDeudaDb,
  loadConfiguracion, saveConfiguracion,
} from "@/services/storage";

export function useFinancialData() {
  const { user } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [config, setConfig] = useState<Configuracion>({
    id: "default",
    ingresoMensualNeto: 0,
    monedaSimbolo: "$",
    nombreMoneda: "COP",
    presupuestoMensualParaDeudas: 0,
    mesesMaxProyeccion: 36,
    estrategiaOrdenDeudas: "SaldoAscendente",
  });
  const [loading, setLoading] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load all data on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchAll() {
      try {
        const [g, d, c] = await Promise.all([loadGastos(), loadDeudas(), loadConfiguracion()]);
        if (cancelled) return;
        setGastos(g);
        setDeudas(d);
        setConfig(c);
        setConfigLoaded(c.id !== "default");
      } catch (err: any) {
        toast.error("Error cargando datos: " + err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [user]);

  // Gastos
  const addGasto = useCallback(async (gasto: Omit<Gasto, "id">) => {
    if (!user) return;
    try {
      const nuevo = await saveGasto(gasto, user.id);
      setGastos((prev) => [nuevo, ...prev]);
    } catch (err: any) {
      toast.error("Error guardando gasto: " + err.message);
    }
  }, [user]);

  const updateGasto = useCallback(async (gasto: Gasto) => {
    try {
      await updateGastoDb(gasto);
      setGastos((prev) => prev.map((g) => (g.id === gasto.id ? gasto : g)));
    } catch (err: any) {
      toast.error("Error actualizando gasto: " + err.message);
    }
  }, []);

  const deleteGastoFn = useCallback(async (id: string) => {
    try {
      await deleteGastoDb(id);
      setGastos((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      toast.error("Error eliminando gasto: " + err.message);
    }
  }, []);

  // Deudas
  const addDeuda = useCallback(async (deuda: Omit<Deuda, "id">) => {
    if (!user) return;
    try {
      const nueva = await saveDeuda(deuda, user.id);
      setDeudas((prev) => [...prev, nueva]);
    } catch (err: any) {
      toast.error("Error guardando deuda: " + err.message);
    }
  }, [user]);

  const updateDeudaFn = useCallback(async (deuda: Deuda) => {
    try {
      await updateDeudaDb(deuda);
      setDeudas((prev) => prev.map((d) => (d.id === deuda.id ? deuda : d)));
    } catch (err: any) {
      toast.error("Error actualizando deuda: " + err.message);
    }
  }, []);

  const deleteDeudaFn = useCallback(async (id: string) => {
    try {
      await deleteDeudaDb(id);
      setDeudas((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      toast.error("Error eliminando deuda: " + err.message);
    }
  }, []);

  // Config
  const updateConfig = useCallback(async (newConfig: Configuracion) => {
    if (!user) return;
    try {
      const saved = await saveConfiguracion(newConfig, user.id);
      setConfig(saved);
      setConfigLoaded(true);
    } catch (err: any) {
      toast.error("Error guardando configuración: " + err.message);
    }
  }, [user]);

  return {
    gastos, addGasto, updateGasto, deleteGasto: deleteGastoFn,
    deudas, addDeuda, updateDeuda: updateDeudaFn, deleteDeuda: deleteDeudaFn,
    config, updateConfig,
    loading, configLoaded,
  };
}
