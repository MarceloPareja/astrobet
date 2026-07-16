# Arquitectura del Sistema - AstroBet

## Descripción General

AstroBet es una plataforma de apuestas deportivas ficticias construida con una arquitectura **client-server** full-stack. El frontend (React + Vite) se comunica con un backend (Express + TypeScript) que persiste datos en **Firebase Firestore**.

---

## Diagrama de Capas

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                   │
│  React 19 + TypeScript + Tailwind CSS + Vite 6      │
│  SPA (Single Page Application)                       │
│  Puerto: 5173 (desarrollo)                           │
└──────────────────────┬──────────────────────────────┘
                       │  HTTP/REST (proxy /api)
                       ▼
┌─────────────────────────────────────────────────────┐
│                 BACKEND (Express)                     │
│  Express 4 + TypeScript (tsx)                        │
│  Puerto: 3000 (desarrollo)                           │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │         Security Middleware Stack             │    │
│  │  Helmet → CORS → Rate Limiter → BodyParser   │    │
│  │  → Input Sanitizer → Morgan Logger            │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │         JWT/JWE Authentication                │    │
│  │  jose (JWE Encryption: dir + A256GCM)         │    │
│  │  bcryptjs (Password Hashing: Salt 10)         │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │         Business Logic Layer                  │    │
│  │  users, matches, bets, transactions,          │    │
│  │  settlement engine                            │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │  Firebase Admin SDK
                       ▼
┌─────────────────────────────────────────────────────┐
│              FIREBASE FIRESTORE                      │
│  NoSQL Document Database (Cloud)                     │
│                                                      │
│  Collections:                                        │
│  ├── users/       (id, username, email, balance,     │
│  │                 role, bankDetails, password)       │
│  ├── matches/     (id, homeTeam, awayTeam, odds,     │
│  │                 status, winner, score)             │
│  ├── bets/        (id, userId, matchId, side,        │
│  │                 amount, payout, status)            │
│  └── transactions/ (id, userId, type, amount,        │
│                     description, createdAt)           │
└─────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|---|---|---|
| React | 19.0.1 | Framework UI (SPA) |
| TypeScript | 5.8.2 | Tipado estático |
| Vite | 6.2.3 | Bundler y dev server |
| Tailwind CSS | 4.1.14 | Estilos utility-first |
| Lucide React | 0.546.0 | Iconografía |
| Motion | 12.23.24 | Animaciones |

### Backend
| Tecnología | Versión | Propósito |
|---|---|---|
| Express | 4.21.2 | Framework HTTP |
| TypeScript | 5.8.2 | Tipado estático |
| tsx | 4.21.0 | Ejecución TS en desarrollo |
| esbuild | 0.25.0 | Bundle para producción |

### Base de Datos
| Tecnología | Versión | Propósito |
|---|---|---|
| Firebase | 12.15.0 | Plataforma backend-as-a-service |
| Firestore | - | Base de datos NoSQL |

---

## Modelo de Datos (Firestore Collections)

### `users`
```
{
  id: string           // "u_" + UUID
  username: string     // unique, lowercase
  fullName: string
  email: string
  password: string     // bcrypt hash
  balance: number      // saldo disponible
  role: "apostador" | "administrador" | "auditor"
  bankDetails: {
    bankName: string
    accountNumber: string
    holderName: string
  }
}
```

### `matches`
```
{
  id: string           // "m_" + UUID
  homeTeam: string
  awayTeam: string
  homeFlag: string     // emoji
  awayFlag: string     // emoji
  oddsRatio: number    // ratio de cuotas
  status: "UPCOMING" | "FINISHED"
  winner?: "LEFT" | "RIGHT"
  startTime: string
  score?: { home: number, away: number }
}
```

### `bets`
```
{
  id: string           // "bet_" + UUID
  userId: string       // ref → users
  matchId: string      // ref → matches
  matchInfo: { homeTeam, awayTeam, homeFlag, awayFlag, oddsRatio }
  side: "LEFT" | "RIGHT"
  amount: number
  potentialPayout: number
  status: "PENDING" | "WON" | "LOST"
  createdAt: string
}
```

### `transactions`
```
{
  id: string           // "tx_" + UUID
  userId: string       // ref → users
  type: "DEPOSIT" | "WITHDRAWAL" | "WIN_PAYOUT" | "BET_PLACE"
  amount: number
  description: string
  createdAt: string
}
```

---

## Flujo de Autenticación

```
1. Registro       → POST /api/register
   - bcrypt.hash(password, salt=10)
   - Se guarda en Firestore
   - Se genera bono de $500

2. Login          → POST /api/login
   - bcrypt.compare(password, hash)
   - Se genera token JWE (EncryptJWT)
   - Algoritmo: dir + A256GCM
   - Expiración: 24h
   - Payload: { id, username, role }

3. Request        → Header "Authorization: Bearer <JWE>"
   - jose.jwtDecrypt(token, key)
   - Se inyecta payload en req.user

4. Refresh        → POST /api/refresh-token
   - Se descifra el token actual
   - Se genera uno nuevo con 24h de expiración
```

---

## Roles del Sistema

| Rol | Permisos |
|---|---|
| `apostador` | Ver partidos, colocar apuestas, depositar, retirar, ver historial |
| `administrador` | Crear partidos, simular resultados, liquidar apuestas, resetear partidos, ver todos los perfiles |
| `auditor` | Solo lectura (definido en enum, sin endpoints dedicados actualmente) |

---

## Flujo de Compilación y Ejecución

```bash
# Desarrollo (frontend + backend simultáneamente)
npm run dev          # concurrently "npm run dev:backend" "npm run dev:frontend"

# Producción
npm run build        # vite build + esbuild bundle
npm start            # node dist/server.cjs (sirve estáticos + API)
```

### Proxy de Desarrollo
Vite proxea `/api` → `http://localhost:3000` para que el frontend consuma la API sin problemas de CORS en desarrollo.

---

## Estructura de Directorios

```
astrobet/
├── backend/
│   ├── server.ts              # Express app + todos los endpoints
│   ├── dbOperations.ts        # Capa de acceso a Firestore
│   ├── firebase.ts            # Inicialización Firebase
│   ├── security.middleware.ts  # Rate limits, sanitizer
│   ├── logger.ts              # Winston logger
│   └── tests/
│       └── api.test.ts        # Tests del backend
├── src/
│   ├── App.tsx                # Componente principal (SPA completa)
│   ├── main.tsx               # Entry point React
│   ├── types.ts               # Enums e interfaces compartidas
│   ├── index.css              # Estilos globales
│   ├── data/
│   │   └── initialMatches.ts  # Datos iniciales de partidos
│   └── server/
│       └── firebase.ts        # Firebase client (referencia)
├── firebase-applet-config.json # Config Firebase (no commitear secretos)
├── package.json
├── vite.config.ts
└── tsconfig.json
```
