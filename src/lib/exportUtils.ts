/**
 * Utilidades para exportar datos financieros
 */

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  // Obtener cabeceras de las llaves del primer objeto
  const headers = Object.keys(data[0]);
  
  // Crear filas
  const rows = data.map(obj => 
    headers.map(header => {
      let val = obj[header];
      // Escapar comas y comillas
      if (typeof val === 'string') {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val === null || val === undefined ? '' : val;
    }).join(',')
  );

  // Unir cabeceras y filas
  const csvContent = [headers.join(','), ...rows].join('\n');
  
  // Crear Blob y descargar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
