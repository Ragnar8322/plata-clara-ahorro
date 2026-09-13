/**
 * Utilidades para exportar datos financieros
 */

type ValorExportable = string | number | boolean | null | undefined;

/**
 * Excel y Google Sheets evalúan como fórmula cualquier celda que empiece por = + - @ (o por tab
 * o retorno de carro). Entrecomillar escapa el separador pero no impide la evaluación: la hoja
 * quita las comillas y ejecuta la fórmula de quien abra el archivo. Se antepone un apóstrofo,
 * que las hojas de cálculo interpretan como "esto es texto" y no muestran en la celda.
 */
function neutralizarFormula(valor: string): string {
  return /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
}

function escaparCelda(valor: ValorExportable): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "number" || typeof valor === "boolean") return String(valor);
  return `"${neutralizarFormula(String(valor)).replace(/"/g, '""')}"`;
}

export function exportToCSV<T extends object>(data: T[], filename: string) {
  if (data.length === 0) return;

  // Las cabeceras salen de la unión de todas las filas: tomarlas solo de la primera descartaba
  // columnas enteras cuando ese primer registro no traía, por ejemplo, `notas`.
  const headers = Array.from(new Set(data.flatMap((fila) => Object.keys(fila))));

  const rows = data.map((obj) =>
    headers.map((header) => escaparCelda((obj as Record<string, ValorExportable>)[header])).join(","),
  );

  // Los encabezados son claves propias (identificadores), no entrada del usuario.
  const csvContent = [headers.join(","), ...rows].join("\n");

  // El BOM evita que Excel en Windows abra el archivo como ANSI y rompa los acentos
  // ("Alimentación" -> "AlimentaciÃ³n").
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
