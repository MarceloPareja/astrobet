# Inventario de activos (endpoints API)

Documento que lista los endpoints exportados por el servidor en `backend/server.ts`.

> Nota: la mayoría de endpoints que requieren autenticación usan el header `Authorization: Bearer <token>`.

| Path | Método | Autenticación | Entradas (params / body) | Salidas (ejemplo) |
|---|---:|---|---|---|
| `/api/health` | GET | No | - | `{ "status": "ok" }` |
| `/api/matches` | GET | No | - | `{ "success": true, "matches": [/*Match[]*/] }` |
| `/api/matches` | POST | Sí | Body: `{ homeTeam, awayTeam, homeFlag, awayFlag, oddsRatio, startTime }` | `{ "success": true, "match": { /*Match*/ } }` |
| `/api/users/:userId` | GET | Sí | Path: `userId` | `{ "success": true, "user": { id, username, fullName, email, balance, bankDetails } }` |
| `/api/register` | POST | No | Body: `{ username, fullName, email, bankDetails, password }` | `{ "success": true, "user": { id, username, fullName, email, balance, bankDetails } }` |
| `/api/login` | POST | No (rate-limited) | Body: `{ username, password }` | `{ "success": true, "user": { id, username, token, ... } }` |
| `/api/bets` | POST | Sí | Body: `{ userId, matchId, matchInfo, side, amount, potentialPayout }` | `{ "success": true, "bet": { /*Bet*/ }, "balance": number }` |
| `/api/bets/:userId` | GET | Sí | Path: `userId` | `{ "success": true, "bets": [/*Bet[]*/] }` |
| `/api/transactions/:userId` | GET | Sí | Path: `userId` | `{ "success": true, "transactions": [/*Transaction[]*/] }` |
| `/api/bank-action` | POST | Sí | Body: `{ userId, type: "DEPOSIT"|"WITHDRAWAL", amount }` | `{ "success": true, "balance": number, "message": string }` (respuesta final después de delay) |
| `/api/admin/simulate-match` | POST | Sí | Body: `{ matchId, winner, homeScore?, awayScore? }` | `{ "success": true, "message": "Simulación exitosa. Se liquidaron X apuestas..." }` |
| `/api/admin/reset-matches` | POST | Sí | - | `{ "success": true, "message": "Partidos reiniciados con éxito." }` |
| `/* static files */` (producción) | GET | No (depende) | - | Sirve archivos estáticos desde `dist/`; `GET *` devuelve `index.html` |

## Notas rápidas

- Cabeceras de autenticación: `Authorization: Bearer <token>`.
- Los endpoints que usan `verifyToken` requieren el JWT generado en `/api/login`.
- Respuestas de éxito usan el campo `success: true` y pueden incluir objetos `match`, `bet`, `user`, `transactions`, etc.
