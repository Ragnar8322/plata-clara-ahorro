import { Configuracion } from "@/types";

export function formatMoney(amount: number, config: Configuracion): string {
  // Cualquier división por cero aguas arriba llegaba hasta la pantalla como "$ NaN" o "$ ∞".
  // Mostrar un guion deja claro que el dato no está disponible en vez de aparentar una cifra.
  if (!Number.isFinite(amount)) {
    return `${config.monedaSimbolo} —`;
  }

  // -0.4 se redondeaba a "-0": se normaliza para no mostrar un cero negativo.
  const normalizado = Object.is(amount, -0) || Math.round(amount) === 0 ? Math.abs(amount) : amount;

  return `${config.monedaSimbolo} ${normalizado.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
