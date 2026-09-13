/**
 * Supabase devuelve sus errores en inglés ("Invalid login credentials"). Mostrarlos crudos dentro
 * de una interfaz en español deja al usuario sin entender qué hacer.
 */
const MENSAJES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "Correo o contraseña incorrectos."],
  [/email not confirmed/i, "Tu correo aún no está confirmado. Revisa tu bandeja de entrada."],
  [/user already registered|already been registered/i, "Ya existe una cuenta con este correo."],
  [/password should be at least/i, "La contraseña debe tener al menos 6 caracteres."],
  [/unable to validate email|invalid email/i, "El correo no es válido."],
  [/email rate limit exceeded|over_email_send_rate_limit/i, "Demasiados intentos. Espera unos minutos."],
  [/network|fetch failed|failed to fetch/i, "No pudimos conectar. Revisa tu conexión a internet."],
];

export function mensajeErrorAuth(error: { message?: string } | null | undefined): string {
  const original = error?.message ?? "";
  const conocido = MENSAJES.find(([patron]) => patron.test(original));
  return conocido ? conocido[1] : "No pudimos completar la operación. Inténtalo de nuevo.";
}
