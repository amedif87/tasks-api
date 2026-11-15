import { isISO8601 } from 'class-validator';

/** Quita espacios de los extremos; deja pasar cualquier otro tipo para que lo rechace el validador. */
export const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Fecha de calendario o fecha/hora con zona explícita, con hasta tres decimales.
export const DUE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d))?$/;

/**
 * Normaliza la fecha límite a ISO 8601 UTC ("2026-12-01" -> "2026-12-01T00:00:00.000Z").
 * Solo normaliza si el original ya es una fecha ISO válida y estricta: `new Date("2026-02-30")`
 * "arregla" fechas imposibles (-> 2 de marzo) y taparía el error. Si no es válida, la devuelve
 * intacta para que IsISO8601 la rechace.
 */
export const toIsoUtc = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string' || !DUE_DATE_PATTERN.test(value) ||
      !isISO8601(value, { strict: true, strictSeparator: true })) return value;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : value;
};
