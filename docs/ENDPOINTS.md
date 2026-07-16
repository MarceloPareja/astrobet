# Endpoints API - AstroBet

## Base URL
```
http://localhost:3000/api
```

---

## Tabla Resumen

| Método | Endpoint | Autenticación | Rol | Descripción |
|---|---|---|---|---|
| `GET` | `/api/health` | ❌ No | - | Health check del servidor |
| `GET` | `/api/matches` | ❌ No | - | Obtener todos los partidos |
| `POST` | `/api/matches` | ✅ JWE | `administrador` | Crear un partido |
| `POST` | `/api/register` | ❌ No | - | Registrar nuevo usuario |
| `POST` | `/api/login` | ❌ No | - | Iniciar sesión |
| `POST` | `/api/refresh-token` | ❌ No | - | Refrescar token JWE |
| `GET` | `/api/users/:userId` | ✅ JWE | Propio / `administrador` | Obtener perfil de usuario |
| `POST` | `/api/bets` | ✅ JWE | `apostador` | Colocar una apuesta |
| `GET` | `/api/bets/:userId` | ✅ JWE | Propio / `administrador` | Obtener apuestas del usuario |
| `GET` | `/api/transactions/:userId` | ✅ JWE | Propio / `administrador` | Obtener transacciones del usuario |
| `POST` | `/api/bank-action` | ✅ JWE | Propio | Depósito o retiro simulado |
| `POST` | `/api/admin/simulate-match` | ✅ JWE | `administrador` | Finalizar partido y liquidar apuestas |
| `POST` | `/api/admin/reset-matches` | ✅ JWE | `administrador` | Reiniciar todos los partidos |

---

## Endpoints Detallados

### Health Check

#### `GET /api/health`
Verifica que el servidor esté operativo.

- **Autenticación:** No requerida
- **Response:**
```json
{ "status": "ok" }
```

---

### Partidos

#### `GET /api/matches`
Obtiene la lista de todos los partidos. Si la colección está vacía, la inicializa automáticamente con los datos por defecto.

- **Autenticación:** No requerida
- **Response:**
```json
{
  "success": true,
  "matches": [
    {
      "id": "m_xxx",
      "homeTeam": "Argentina",
      "awayTeam": "Brasil",
      "homeFlag": "🇦🇷",
      "awayFlag": "🇧🇷",
      "oddsRatio": 2.0,
      "status": "UPCOMING",
      "startTime": "Hoy, 20:00"
    }
  ]
}
```

#### `POST /api/matches`
Crea un nuevo partido. Solo administradores.

- **Autenticación:** JWE Token requerido
- **Autorización:** Rol `administrador`
- **Body:**
```json
{
  "homeTeam": "Argentina",
  "awayTeam": "Brasil",
  "homeFlag": "🇦🇷",
  "awayFlag": "🇧🇷",
  "oddsRatio": 2.0,
  "startTime": "Hoy, 20:00"
}
```
- **Response:**
```json
{
  "success": true,
  "match": { "id": "m_xxx", ... }
}
```
- **Errores:**
  - `400` — Datos incompletos
  - `401` — Token no válido
  - `403` — No tiene permisos de administrador

---

### Autenticación

#### `POST /api/register`
Registra un nuevo usuario. Se aplica **rate limit: 3 registros/hora por IP**.

- **Autenticación:** No requerida
- **Rate Limit:** 3 req / hora
- **Body:**
```json
{
  "username": "astrorider",
  "password": "Astro1234!",
  "fullName": "Juan Pérez",
  "email": "juan@astro.com",
  "bankDetails": {
    "bankName": "Banco de la Galaxia",
    "accountNumber": "ES12 3456 7890 1234 5678",
    "holderName": "Juan Pérez"
  }
}
```
- **Response:**
```json
{
  "success": true,
  "user": {
    "id": "u_xxx",
    "username": "astrorider",
    "fullName": "Juan Pérez",
    "email": "juan@astro.com",
    "balance": 500.00,
    "role": "apostador",
    "bankDetails": { ... }
  }
}
```
- **Side Effects:**
  - Se crea una transacción de tipo `DEPOSIT` por el bono de bienvenida ($500.00)
  - La contraseña se almacena hasheada con bcrypt (salt 10)
- **Errores:**
  - `400` — Datos incompletos o usuario ya existe

#### `POST /api/login`
Inicia sesión y retorna un token JWE. Se aplica **rate limit: 5 intentos/15 min por IP**.

- **Autenticación:** No requerida
- **Rate Limit:** 5 req / 15 min
- **Body:**
```json
{
  "username": "astrorider",
  "password": "Astro1234!"
}
```
- **Response:**
```json
{
  "success": true,
  "user": {
    "id": "u_xxx",
    "username": "astrorider",
    "fullName": "Juan Pérez",
    "balance": 500.00,
    "role": "apostador",
    "token": "eyJhbGciOiJkaXIiLCJlY2..."   // ← Token JWE cifrado
  }
}
```
- **Errores:**
  - `400` — Faltan campos
  - `401` — Credenciales inválidas

#### `POST /api/refresh-token`
Refresca un token JWE por vencer. Genera uno nuevo con 24h de validez.

- **Autenticación:** No requerida (el token se envía en body)
- **Body:**
```json
{
  "token": "eyJhbGciOiJkaXIiLCJlY2..."
}
```
- **Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJkaXIiLCJlY2..."   // ← Nuevo token JWE
}
```
- **Errores:**
  - `401` — Token expirado o inválido

---

### Usuarios

#### `GET /api/users/:userId`
Obtiene el perfil de un usuario. Solo el propio usuario o un administrador pueden acceder.

- **Autenticación:** JWE Token requerido
- **Autorización:** Propio usuario o `administrador`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "user": {
    "id": "u_xxx",
    "username": "astrorider",
    "fullName": "Juan Pérez",
    "email": "juan@astro.com",
    "balance": 500.00,
    "role": "apostador",
    "bankDetails": { ... }
  }
}
```
- **Nota:** La contraseña nunca se retorna. `bankDetails` solo se retorna al dueño del perfil.
- **Errores:**
  - `403` — Sin permiso para ver este perfil
  - `404` — Usuario no encontrado

---

### Apuestas

#### `POST /api/bets`
Coloca una apuesta en un partido. Solo usuarios con rol `apostador`.

- **Autenticación:** JWE Token requerido
- **Autorización:** Rol `apostador` (no `administrador`)
- **Body:**
```json
{
  "matchId": "m_xxx",
  "matchInfo": {
    "homeTeam": "Argentina",
    "awayTeam": "Brasil",
    "homeFlag": "🇦🇷",
    "awayFlag": "🇧🇷",
    "oddsRatio": 2.0
  },
  "side": "LEFT",
  "amount": 100,
  "potentialPayout": 300.00
}
```
- **Response:**
```json
{
  "success": true,
  "bet": {
    "id": "bet_xxx",
    "userId": "u_xxx",
    "matchId": "m_xxx",
    "side": "LEFT",
    "amount": 100,
    "potentialPayout": 300.00,
    "status": "PENDING",
    "createdAt": "16/7/2026, 20:00:00"
  },
  "balance": 400.00
}
```
- **Side Effects:**
  - Se descuenta el monto del saldo del usuario
  - Se crea una transacción de tipo `BET_PLACE`
- **Errores:**
  - `400` — Datos incompletos o saldo insuficiente
  - `403` — Los administradores no pueden apostar

#### `GET /api/bets/:userId`
Obtiene todas las apuestas de un usuario.

- **Autenticación:** JWE Token requerido
- **Autorización:** Propio usuario o `administrador`
- **Response:**
```json
{
  "success": true,
  "bets": [
    {
      "id": "bet_xxx",
      "matchId": "m_xxx",
      "side": "LEFT",
      "amount": 100,
      "potentialPayout": 300.00,
      "status": "WON",
      "createdAt": "16/7/2026"
    }
  ]
}
```

---

### Transacciones

#### `GET /api/transactions/:userId`
Obtiene el historial de transacciones de un usuario.

- **Autenticación:** JWE Token requerido
- **Autorización:** Propio usuario o `administrador`
- **Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "tx_xxx",
      "userId": "u_xxx",
      "type": "DEPOSIT",
      "amount": 500.00,
      "description": "Bono Inicial de Bienvenida AstroBet",
      "createdAt": "16/7/2026, 20:00:00"
    }
  ]
}
```
- **Tipos de transacción:** `DEPOSIT`, `WITHDRAWAL`, `WIN_PAYOUT`, `BET_PLACE`

---

### Operaciones Bancarias

#### `POST /api/bank-action`
Realiza un depósito o retiro simulado de fondos.

- **Autenticación:** JWE Token requerido
- **Body:**
```json
{
  "type": "DEPOSIT",
  "amount": 200
}
```
- **Valores de `type`:** `DEPOSIT` | `WITHDRAWAL`
- **Response (con delay de 1.5s simulando latencia):**
```json
{
  "success": true,
  "balance": 700.00,
  "message": "¡Operación de Depósito exitosa!"
}
```
- **Side Effects:**
  - Se actualiza el saldo del usuario
  - Se crea una transacción correspondiente
- **Errores:**
  - `400` — Monto inválido o saldo insuficiente (retiro)

---

### Administración

#### `POST /api/admin/simulate-match`
Finaliza un partido, establece el ganador y liquidar todas las apuestas pendientes. Los ganadores reciben su `potentialPayout` automáticamente.

- **Autenticación:** JWE Token requerido
- **Autorización:** Rol `administrador`
- **Body:**
```json
{
  "matchId": "m_xxx",
  "winner": "LEFT",
  "homeScore": 2,
  "awayScore": 1
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Simulación exitosa. Se liquidaron 5 apuestas. 3 ganadores pagados."
}
```
- **Side Effects:**
  - Se actualiza el estado del partido a `FINISHED`
  - Se marca cada apuesta como `WON` o `LOST`
  - Se acredita el saldo a los ganadores
  - Se crean transacciones de tipo `WIN_PAYOUT` para cada ganador

#### `POST /api/admin/reset-matches`
Reinicia todos los partidos a estado `UPCOMING` con scores nulos.

- **Autenticación:** JWE Token requerido
- **Autorización:** Rol `administrador`
- **Response:**
```json
{
  "success": true,
  "message": "Partidos reiniciados con éxito."
}
```

---

## Códigos de Error Comunes

| Código | Significado |
|---|---|
| `400` | Solicitud incorrecta (datos faltantes o inválidos) |
| `401` | No autenticado (token faltante, inválido o expirado) |
| `403` | Sin permisos (rol insuficiente) |
| `404` | Recurso no encontrado |
| `429` | Demasiadas solicitudes (rate limit excedido) |
| `500` | Error interno del servidor |

---

## Headers de Autenticación

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <token_jwe>
```

El token es un JWT cifrado (JWE) generado con el algoritmo `dir + A256GCM` mediante la librería `jose`.
