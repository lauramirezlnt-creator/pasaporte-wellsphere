/**
 * Autenticación por usuario + contraseña (sin correo real).
 *
 * Supabase Auth solo soporta identidad por email, así que cada "usuario"
 * se mapea internamente a un email sintético dentro de un dominio que
 * nunca recibe correos reales: `<username>@pasaporte.local`.
 *
 * Reglas de username:
 *   - 3 a 20 caracteres.
 *   - Solo letras, números, puntos, guiones y guiones bajos.
 *   - Sin espacios ni "@" (para no confundir con un correo real).
 */

export const USERNAME_DOMAIN = "pasaporte.local";

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,20}$/;

export function isValidUsername(username: string): boolean {
  const normalized = username.trim();
  return USERNAME_REGEX.test(normalized);
}

export function usernameErrorMessage(): string {
  return "El usuario debe tener entre 3 y 20 caracteres (letras, números, puntos, guiones o guion bajo, sin espacios).";
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** Convierte un username en el email sintético que usa Supabase Auth internamente. */
export function usernameToSyntheticEmail(username: string): string {
  return `${normalizeUsername(username)}@${USERNAME_DOMAIN}`;
}

/** Extrae el username original a partir del email sintético guardado en Supabase Auth. */
export function syntheticEmailToUsername(email: string | null | undefined): string {
  if (!email) return "";
  const suffix = `@${USERNAME_DOMAIN}`;
  return email.toLowerCase().endsWith(suffix) ? email.slice(0, -suffix.length) : email;
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function passwordErrorMessage(): string {
  return "La contraseña debe tener al menos 6 caracteres.";
}
