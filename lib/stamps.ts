export type StampId =
  | "thoughts"
  | "emotions"
  | "body"
  | "connections"
  | "values_fair";

export interface StampDefinition {
  id: StampId;
  order: number;
  label: string;
  /** Fecha ISO (YYYY-MM-DD) en la que corre el sello, hora Bogotá. */
  date: string;
  /** Fecha en formato legible para mostrar en UI. */
  displayDate: string;
  description: string;
}

/**
 * Catálogo único de las 5 fechas/sellos del pasaporte.
 * Esta es la fuente de verdad tanto para el frontend como referencia
 * para la función SQL `register_stamp` (los stamp_id permitidos deben
 * coincidir exactamente con los definidos aquí y en supabase/schema.sql).
 */
export const STAMPS: StampDefinition[] = [
  {
    id: "thoughts",
    order: 1,
    label: "Tus pensamientos",
    date: "2026-10-07",
    displayDate: "Miércoles 7 de octubre",
    description: "Primer destino del recorrido: explora tu mundo mental."
  },
  {
    id: "emotions",
    order: 2,
    label: "Tus emociones",
    date: "2026-10-14",
    displayDate: "Miércoles 14 de octubre",
    description: "Segundo destino: reconoce y gestiona tus emociones."
  },
  {
    id: "body",
    order: 3,
    label: "Tu cuerpo",
    date: "2026-10-21",
    displayDate: "Miércoles 21 de octubre",
    description: "Tercer destino: bienestar físico y energía."
  },
  {
    id: "connections",
    order: 4,
    label: "Tus conexiones",
    date: "2026-10-28",
    displayDate: "Miércoles 28 de octubre",
    description: "Cuarto destino: vínculos que suman a tu bienestar."
  },
  {
    id: "values_fair",
    order: 5,
    label: "Lo que es importante para ti",
    date: "2026-11-04",
    displayDate: "Miércoles 4 de noviembre · Feria",
    description: "Destino final: la Feria presencial. Un solo sello, sin importar cuántas estaciones visites."
  }
];

export const STAMP_IDS: StampId[] = STAMPS.map((s) => s.id);

export function isValidStampId(value: string): value is StampId {
  return (STAMP_IDS as string[]).includes(value);
}

export function getStampById(id: string): StampDefinition | undefined {
  return STAMPS.find((s) => s.id === id);
}

/** Ventana de check-in, igual para las 5 fechas, hora Bogotá (COT, UTC-5 fijo, sin horario de verano). */
export const CHECKIN_WINDOW = {
  startHour: 8,
  endHour: 12
};
