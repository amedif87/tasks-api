import { isISO8601 } from 'class-validator';

/** Quita espacios de los extremos; deja pasar cualquier otro tipo para que lo rechace el validador. */
export const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/**
 * Normaliza la fecha límite a ISO 8601 UTC ("2026-12-01" -> "2026-12-01T00:00:00.000Z").
 * Solo normaliza si el original ya es una fecha ISO válida y estricta: `new Date("2026-02-30")`
 * "arregla" fechas imposibles (-> 2 de marzo) y taparía el error. Si no es válida, la devuelve
 * intacta para que IsISO8601 la rechace.
 */
export const toIsoUtc = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string' || !isISO8601(value, { strict: true, strictSeparator: true })) return value;
  return new Date(value).toISOString();
};
