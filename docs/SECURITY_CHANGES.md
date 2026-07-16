# Cambios de Seguridad - AstroBet

## Resumen de Medidas de Seguridad Implementadas

Este documento describe todas las capas de seguridad implementadas en AstroBet para proteger la autenticación, las transacciones y la integridad de la aplicación.

---

## 1. Autenticación JWE (JSON Web Encryption)

### Implementación
- **Biblioteca:** `jose` v6.2.3 (librería moderna del JOSE Working Group)
- **Algoritmo de cifrado:** `dir` (Direct symmetric key) + `A256GCM` (AES-256-GCM)
- **Derivación de clave:** SHA-256 hash del `JWT_SECRET`

### Cómo funciona

```typescript
// Derivación de la clave de cifrado
function getJweKey(): Uint8Array {
  return new Uint8Array(createHash('sha256').update(JWT_SECRET).digest());
}

// Cifrado al hacer login
const token = await new jose.EncryptJWT({ id, username, role })
  .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
  .setIssuedAt()
  .setExpirationTime('24h')
  .encrypt(getJweKey());

// Descifrado en cada request autenticado
const { payload } = await jose.jwtDecrypt(token, getJweKey());
```

### Diferencia con JWT tradicional
| Característica | JWT (JWS) | JWE (este sistema) |
|---|---|---|
| Cifrado del payload | ❌ Solo firmado (payload legible) | ✅ Totalmente cifrado |
| Protección del payload | Integridad | Integridad + Confidencialidad |
| Algoritmo | RS256 / HS256 | dir + A256GCM (simétrico) |
| Lectura del token | Cualquiera puede decodificar | Solo quien tiene la clave |

### Expiración
- Token válido por **24 horas**
- Endpoint `/api/refresh-token` para extender sin re-login

---

## 2. Hash de Contraseñas con bcrypt

### Implementación
- **Biblioteca:** `bcryptjs` v3.0.3
- **Salt rounds:** 10

```typescript
// Registro: hash de la contraseña
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Login: verificación
const validPassword = await bcrypt.compare(password, user.password);
```

### Beneficios
- Protección contra ataques de fuerza bruta con rainbow tables
- Salt único por usuario (evita precomputation)
- Coste computacional ajustable (factor 10)

---

## 3. CORS (Cross-Origin Resource Sharing)

### Configuración

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',   // Configurable por variable de entorno
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
```

### Recomendación de Producción

Configurar la variable de entorno `FRONTEND_URL` para restringir el acceso:

```bash
# .env
FRONTEND_URL=http://localhost:5173
```

Esto asegura que solo el frontend del mismo servidor pueda hacer peticiones a la API, bloqueando cualquier dominio malicioso.

### Métodos HTTP Permitidos
- `GET` — Lectura de datos
- `POST` — Creación y autenticación
- `PUT` — Actualizaciones
- `DELETE` — Eliminación
- `OPTIONS` — Preflight requests (necesario para CORS)

---

## 4. Rate Limiting (Limitación de Peticiones)

### Implementación
- **Biblioteca:** `express-rate-limit` v8.5.2

### Límites configurados

| Endpoint | Ventana | Límite | Propósito |
|---|---|---|---|
| API General (`apiLimiter`) | 15 min | 100 req/IP | Protección general contra DDoS |
| Login (`loginLimiter`) | 15 min | 5 req/IP | Prevenir fuerza bruta en login |
| Registro (`registerLimiter`) | 1 hora | 3 req/IP | Evitar creación masiva de cuentas |

### Headers de respuesta
- `RateLimit-Limit`: máximo de peticiones
- `RateLimit-Remaining`: peticiones restantes
- `RateLimit-Reset`: timestamp de reset

---

## 5. Helmet (Seguridad HTTP Headers)

### Implementación

```typescript
app.use(helmet());
```

### Headers que configura automáticamente
- `Content-Security-Policy` — Política de contenido
- `X-Content-Type-Options: nosniff` — Prevenir MIME sniffing
- `X-Frame-Options: DENY` — Prevenir clickjacking
- `Strict-Transport-Security` — Forzar HTTPS (en producción)
- `X-XSS-Protection` — Filtro XSS del navegador
- `Referrer-Policy` — Control de información de referrer

---

## 6. Sanitización de Entradas (Input Sanitizer)

### Implementación personalizada (`security.middleware.ts`)

```typescript
function sanitizeValue(val: any): any {
  // Elimina tags <script>
  // Elimina javascript: URLs
  // Elimina event handlers (onload, onclick, etc.)
  // Filtra prototype pollution keys (__proto__, constructor, prototype)
}
```

### Protecciones
| Amenaza | Medida |
|---|---|
| XSS (Cross-Site Scripting) | Eliminación de `<script>` tags, `javascript:` URIs, event handlers |
| Prototype Pollution | Bloqueo de keys `__proto__`, `constructor`, `prototype` |
| Inyección en Query/Params | Sanitización de `req.body`, `req.query`, `req.params` |

---

## 7. Control de Acceso por Roles (RBAC)

### Middlewares de autorización

```typescript
// Middleware: verificar token
const verifyToken = async (req, res, next) => { ... }

// Middleware: verificar rol específico
const requireRole = (...roles: Role[]) => { ... }
```

### Protección de endpoints

| Endpoint | Roles Permitidos |
|---|---|
| `POST /api/matches` | Solo `administrador` |
| `POST /api/admin/simulate-match` | Solo `administrador` |
| `POST /api/admin/reset-matches` | Solo `administrador` |
| `POST /api/bets` | Solo `apostador` (no admin) |
| `GET /api/users/:userId` | Propio usuario o `administrador` |
| `GET /api/bets/:userId` | Propio usuario o `administrador` |
| `GET /api/transactions/:userId` | Propio usuario o `administrador` |

---

## 8. Protección de Datos Sensibles

### En Respuestas API
```typescript
// La contraseña NUNCA se retorna en respuestas
delete userToReturn.password;

// bankDetails solo se retorna al usuario dueño del perfil
if (tokenUser.id !== requestedUserId) {
  delete userToReturn.bankDetails;
}
```

### Logging
- **Winston Logger** registra errores con stack trace en archivos (`logs/error.log`, `logs/app.log`)
- En producción, solo nivel `info` (sin datos sensibles en logs)
- Morgan para logging de requests HTTP

---

## 9. Morgan (HTTP Request Logging)

```typescript
app.use(morgan('combined', { 
  stream: { write: message => logger.info(message.trim()) } 
}));
```

Formato `combined` registra: IP, fecha, método, URL, status, tamaño, referrer, user-agent.

---

## 10. Límites de Body Parser

```typescript
app.use(express.json({ limit: '1mb' }));
```

Previene ataques de denial of service enviando payloads JSON extremadamente grandes.

---

## 11. CI/CD — Seguridad en Integración Continua

### Pipeline de GitHub Actions (`.github/workflows/ci.yml`)

El pipeline de CI/CD se compone de dos jobs paralelos:

#### `typecheck-and-build`
Ejecuta verificación de tipos y compilación. No necesita credenciales externas.

- `tsc --noEmit` — type checking
- `vite build` — build frontend
- `esbuild` — bundle backend

#### `backend-tests`
Corre los tests del backend que requieren conexión a Firebase Firestore. Para evitar exponer credenciales en el repositorio:

```yaml
- name: Escribir config Firebase desde secret
  run: |
    if [ -n "${{ secrets.FIREBASE_CONFIG_JSON }}" ]; then
      echo '${{ secrets.FIREBASE_CONFIG_JSON }}' > firebase-applet-config.json
    fi
```

### Manejo de Secrets

| Práctica | Implementación |
|---|---|
| `firebase-applet-config.json` NO se commitea | Incluido en `.gitignore` bajo `*.json` de config o manejado manualmente |
| Credenciales inyectadas vía GitHub Secrets | `FIREBASE_CONFIG_JSON` contiene el contenido exacto del archivo de configuración |
| Secrets no visibles en logs | GitHub Actions enmascara automáticamente los valores de `${{ secrets.* }}` |
| Tests omitidos si falta el secret | El pipeline continúa exitosamente, solo muestra un warning |

### Configuración en el Repositorio

Para activar los tests en CI, el administrador del repositorio debe:

1. Ir a **Settings → Secrets and variables → Actions**
2. Crear un nuevo secret llamado `FIREBASE_CONFIG_JSON`
3. Pegar el contenido completo del archivo `firebase-applet-config.json` local

### Protección contra Exposición

- El secret `FIREBASE_CONFIG_JSON` **nunca** se imprime en los logs de Actions
- Las ramas protegidas pueden requerir que el CI pase antes de mergear
- Workflows de PR desde forks no tienen acceso a los secrets (seguridad por diseño)

---

## Resumen de Capas de Seguridad

```
Request entrante
    │
    ▼
┌─────────────────────────┐
│ 1. Helmet               │  Headers de seguridad HTTP
├─────────────────────────┤
│ 2. CORS                  │  Origen permitido
├─────────────────────────┤
│ 3. Rate Limiter          │  Anti-DDoS / Anti-Fuerza Bruta
├─────────────────────────┤
│ 4. Body Parser (1mb)     │  Límite de payload
├─────────────────────────┤
│ 5. Input Sanitizer       │  Anti-XSS / Anti-Prototype Pollution
├─────────────────────────┤
│ 6. Morgan Logger         │  Auditoría de requests
├─────────────────────────┤
│ 7. verifyToken (JWE)     │  Autenticación cifrada
├─────────────────────────┤
│ 8. requireRole           │  Autorización por rol
└─────────────────────────┘
```

---

## Variables de Entorno Requeridas

```bash
JWT_SECRET=tu_clave_secreta_aqui    # Clave para cifrar/descifrar JWE tokens
FRONTEND_URL=http://localhost:5173  # Origen permitido por CORS
PORT=3000                           # Puerto del backend
NODE_ENV=production                 # Activa logs de nivel info
SERVE_STATIC=true                   # Sirve archivos estáticos en producción
```
