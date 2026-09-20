// ============================================
// CONFIG — Logger de Winston + stream para Morgan
// ============================================
// Winston reemplaza a console.log en todo el proyecto. Morgan registra cada
// petición HTTP y le entrega la línea a Winston (nivel `http`) en vez de
// escribir directo a stdout, para que todos los logs pasen por un mismo lugar.

import { createLogger, format, transports } from 'winston';
import morgan from 'morgan';

const isDev = process.env['NODE_ENV'] !== 'production';

// En desarrollo: legible y coloreado. En producción: JSON parseable por
// agregadores de logs (CloudWatch, Loki, Datadog...).
const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
);

const prodFormat = format.combine(format.timestamp(), format.json());

export const logger = createLogger({
  // En dev se ve todo hasta el nivel http (peticiones incluidas);
  // en producción solo warn y error, para no inundar el disco.
  level: isDev ? 'http' : 'warn',
  format: isDev ? devFormat : prodFormat,
  transports: [
    new transports.Console(),
    // El archivo de errores solo tiene sentido en producción.
    ...(isDev ? [] : [new transports.File({ filename: 'logs/error.log', level: 'error' })]),
  ],
});

// Morgan escribe strings terminados en \n — el .trim() evita líneas en blanco.
export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

const morganFormat = isDev ? 'dev' : 'combined';

export const morganMiddleware = morgan(morganFormat, { stream: morganStream });
