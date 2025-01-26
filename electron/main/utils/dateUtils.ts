import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extendemos dayjs con plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Devuelve la fecha/hora local de "America/Mexico_City" en formato "YYYY-MM-DD HH:mm:ss".
 */
export function getHoraLocalCDMX(): string {
  // Tomamos la hora actual
  const now = dayjs();

  // Ajustamos a la zona horaria de la Ciudad de México
  const cdmxTime = now.tz('America/Mexico_City');

  // Formateamos: "2025-01-25 23:47:00"
  return cdmxTime.format('YYYY-MM-DD HH:mm:ss');
}
