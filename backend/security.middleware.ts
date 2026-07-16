import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Limitador de peticiones para prevenir fuerza bruta y DDoS
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por IP cada 15 min
  message: {
    success: false,
    error: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo después de 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador estricto para el Login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Límite de 5 intentos fallidos/exitosos por IP cada 15 min
  message: {
    success: false,
    error: 'Demasiados intentos de inicio de sesión. Por seguridad, tu IP ha sido bloqueada temporalmente. Intenta en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador para registro (evita creación masiva de cuentas)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 registros por IP por hora
  message: {
    success: false,
    error: 'Demasiados registros desde esta IP. Intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Sanitizador básico contra XSS y prototype pollution
function sanitizeValue(val: any): any {
  if (typeof val === 'string') {
    // Elimina tags script básicos, o puedes usar una librería más robusta si fuera necesario
    return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+=/gi, '')
              .trim();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val !== null && typeof val === 'object') {
    const sanitizedObj: any = {};
    for (const key of Object.keys(val)) {
      if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        sanitizedObj[key] = sanitizeValue(val[key]);
      }
    }
    return sanitizedObj;
  }
  return val;
}

export const inputSanitizer = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
};
