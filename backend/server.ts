import express, { Request, Response, NextFunction } from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import * as jose from "jose";
import { createHash, randomUUID } from "crypto";
import { logger } from "./logger";
import { apiLimiter, loginLimiter, registerLimiter, inputSanitizer } from "./security.middleware";
import {
  getUserByUsername,
  getUserById,
  createUser,
  updateUserBalance,
  getMatches,
  resetMatches,
  updateMatch,
  createMatch,
  getBets,
  createBet,
  getTransactions,
  createTransaction,
  settleMatchBets
} from "./dbOperations";
import { User as AppUser, Match, Bet, Transaction, BetSide, MatchStatus, BetStatus, Role } from "../src/types";

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_astrobet';

function getJweKey(): Uint8Array {
  return new Uint8Array(createHash('sha256').update(JWT_SECRET).digest());
}

// Middleware to verify JWE token
const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Acceso denegado. No se proporcionó un token." });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Token inválido." });
  }
  try {
    const { payload } = await jose.jwtDecrypt(token, getJweKey());
    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Token expirado o inválido." });
  }
};

// Middleware to require specific role
const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: "No autenticado." });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ success: false, error: "No tienes permisos para realizar esta acción." });
    }
    next();
  };
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Security middlewares
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  }));
  app.use(apiLimiter);
  app.use(express.json({ limit: '1mb' }));
  app.use(inputSanitizer);

  // HTTP request logger
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

  // --- API ENDPOINTS ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get current matches
  app.get("/api/matches", async (req, res) => {
    try {
      const matches = await getMatches();
      res.json({ success: true, matches });
    } catch (err: any) {
      console.error("Error fetching matches:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create a match
  app.post("/api/matches", verifyToken, requireRole(Role.ADMINISTRADOR), async (req, res) => {
    try {
      const { homeTeam, awayTeam, homeFlag, awayFlag, oddsRatio, startTime } = req.body;
      if (!homeTeam || !awayTeam || !homeFlag || !awayFlag || !oddsRatio || !startTime) {
        return res.status(400).json({ success: false, error: "Datos de partido incompletos" });
      }

      const matchId = "m_" + randomUUID();
      const newMatch: Match = {
        id: matchId,
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        homeFlag: homeFlag.trim(),
        awayFlag: awayFlag.trim(),
        oddsRatio: Number(oddsRatio),
        status: MatchStatus.UPCOMING,
        startTime: startTime.trim()
      };

      await createMatch(newMatch);
      res.json({ success: true, match: newMatch });
    } catch (err: any) {
      console.error("Error creating match:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get user profile/balance
  app.get("/api/users/:userId", verifyToken, async (req, res) => {
    try {
      const tokenUser = (req as any).user;
      const requestedUserId = req.params.userId;
      if (tokenUser.id !== requestedUserId && tokenUser.role !== Role.ADMINISTRADOR) {
        return res.status(403).json({ success: false, error: "No tienes permiso para ver este perfil." });
      }

      const user = await getUserById(requestedUserId);
      if (!user) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }
      const userToReturn = { ...user, role: user.role || Role.APOSTADOR };
      delete userToReturn.password;
      // Only return bankDetails if the user is viewing their own profile
      if (tokenUser.id !== requestedUserId) {
        delete userToReturn.bankDetails;
      }
      res.json({ success: true, user: userToReturn });
    } catch (err: any) {
      console.error("Error fetching user:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Register user
  app.post("/api/register", registerLimiter, async (req, res) => {
    try {
      const { username, fullName, email, bankDetails, password } = req.body;
      if (!username || !fullName || !email || !bankDetails || !password) {
        return res.status(400).json({ success: false, error: "Datos de registro incompletos. Se requiere contraseña." });
      }

      const existingUser = await getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ success: false, error: "El nombre de usuario ya existe" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = "u_" + randomUUID();
      const newUser: AppUser = {
        id: userId,
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        email: email.trim(),
        balance: 500.00, // Welcome bonus
        role: Role.APOSTADOR,
        bankDetails,
        password: hashedPassword
      };

      await createUser(newUser);

      // Create welcome bonus transaction
      const welcomeTx: Transaction = {
        id: "tx_" + randomUUID(),
        userId: newUser.id,
        type: "DEPOSIT",
        amount: 500.00,
        description: "Bono Inicial de Bienvenida AstroBet 🚀",
        createdAt: new Date().toLocaleString()
      };
      await createTransaction(welcomeTx);

      const userToReturn = { ...newUser };
      delete userToReturn.password;

      res.json({ success: true, user: userToReturn });
    } catch (err: any) {
      logger.error(`Error in registration: ${err.message}`, { stack: err.stack });
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Login user
  app.post("/api/login", loginLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "Usuario y contraseña requeridos" });
      }

      const user = await getUserByUsername(username);
      if (!user || !user.password) {
        return res.status(401).json({ success: false, error: "Credenciales inválidas" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ success: false, error: "Credenciales inválidas" });
      }

      const userRole = user.role || Role.APOSTADOR;

      const token = await new jose.EncryptJWT({ id: user.id, username: user.username, role: userRole })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .encrypt(getJweKey());

      const userToReturn = { ...user, role: userRole, token };
      delete userToReturn.password;

      res.json({ success: true, user: userToReturn });
    } catch (err: any) {
      logger.error(`Error in login: ${err.message}`, { stack: err.stack });
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Refresh token (extend expiration)
  app.post("/api/refresh-token", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, error: "Token requerido" });
      }

      const { payload } = await jose.jwtDecrypt(token, getJweKey());
      if (!payload.id || !payload.username || !payload.role) {
        return res.status(401).json({ success: false, error: "Token inválido" });
      }

      const newToken = await new jose.EncryptJWT({ id: payload.id, username: payload.username, role: payload.role })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .encrypt(getJweKey());

      res.json({ success: true, token: newToken });
    } catch (err: any) {
      return res.status(401).json({ success: false, error: "Token expirado o inválido. Inicia sesión nuevamente." });
    }
  });

  // Place bet
  app.post("/api/bets", verifyToken, async (req, res) => {
    try {
      const decoded = (req as any).user;
      if (decoded.role === Role.ADMINISTRADOR) {
        return res.status(403).json({ success: false, error: "Los administradores no pueden realizar apuestas" });
      }

      const { matchId, matchInfo, side, amount, potentialPayout } = req.body;
      if (!decoded.id || !matchId || !matchInfo || !side || !amount) {
        return res.status(400).json({ success: false, error: "Datos de apuesta incompletos" });
      }

      const user = await getUserById(decoded.id);
      if (!user) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }

      const amountNum = Number(amount);
      if (user.balance < amountNum) {
        return res.status(400).json({ success: false, error: "Saldo insuficiente" });
      }

      // Deduct balance
      const newBalance = Number((user.balance - amountNum).toFixed(4));
      await updateUserBalance(decoded.id, newBalance);

      // Create bet
      const betId = "bet_" + randomUUID();
      const newBet: Bet = {
        id: betId,
        userId: decoded.id,
        matchId,
        matchInfo,
        side,
        amount: amountNum,
        potentialPayout: Number(Number(potentialPayout).toFixed(4)),
        status: BetStatus.PENDING,
        createdAt: new Date().toLocaleString()
      };
      await createBet(newBet);

      // Create transaction log
      const betTx: Transaction = {
        id: "tx_" + randomUUID(),
        userId: decoded.id,
        type: "BET_PLACE",
        amount: amountNum,
        description: `Apuesta colocada al ${side === BetSide.LEFT ? matchInfo.homeTeam : matchInfo.awayTeam} (${matchInfo.homeTeam} vs ${matchInfo.awayTeam})`,
        createdAt: new Date().toLocaleString()
      };
      await createTransaction(betTx);

      res.json({ success: true, bet: newBet, balance: newBalance });
    } catch (err: any) {
      console.error("Error placing bet:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get user's bets
  app.get("/api/bets/:userId", verifyToken, async (req, res) => {
    try {
      const tokenUser = (req as any).user;
      if (tokenUser.id !== req.params.userId && tokenUser.role !== Role.ADMINISTRADOR) {
        return res.status(403).json({ success: false, error: "No tienes permiso para ver estas apuestas." });
      }
      const bets = await getBets(req.params.userId);
      res.json({ success: true, bets });
    } catch (err: any) {
      console.error("Error fetching user bets:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get user's transactions
  app.get("/api/transactions/:userId", verifyToken, async (req, res) => {
    try {
      const tokenUser = (req as any).user;
      if (tokenUser.id !== req.params.userId && tokenUser.role !== Role.ADMINISTRADOR) {
        return res.status(403).json({ success: false, error: "No tienes permiso para ver estas transacciones." });
      }
      const transactions = await getTransactions(req.params.userId);
      res.json({ success: true, transactions });
    } catch (err: any) {
      console.error("Error fetching user transactions:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Simulated deposit/withdrawal
  app.post("/api/bank-action", verifyToken, async (req, res) => {
    try {
      const decoded = (req as any).user;
      const { type, amount } = req.body;
      if (!decoded.id || !type || !amount) {
        return res.status(400).json({ success: false, error: "Datos bancarios incompletos" });
      }

      const user = await getUserById(decoded.id);
      if (!user) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ success: false, error: "Monto inválido" });
      }

      if (type === "WITHDRAWAL" && user.balance < amountNum) {
        return res.status(400).json({ success: false, error: "Saldo insuficiente" });
      }

      // Simulate network latency (1.5 seconds)
      setTimeout(async () => {
        try {
          let finalBalance = user.balance;
          let txDesc = "";

          if (type === "DEPOSIT") {
            finalBalance += amountNum;
            txDesc = `Depósito recibido desde ${user.bankDetails?.bankName || "Banco Vinculado"}`;
          } else {
            finalBalance -= amountNum;
            txDesc = `Retiro enviado a ${user.bankDetails?.bankName || "Banco Vinculado"}`;
          }

          const finalBalanceFixed = Number(finalBalance.toFixed(4));
          await updateUserBalance(decoded.id, finalBalanceFixed);

          // Add transaction record
          const bankTx: Transaction = {
            id: "tx_" + randomUUID(),
            userId: decoded.id,
            type,
            amount: amountNum,
            description: txDesc,
            createdAt: new Date().toLocaleString()
          };
          await createTransaction(bankTx);

          res.json({
            success: true,
            balance: finalBalanceFixed,
            message: `¡Operación de ${type === "DEPOSIT" ? "Depósito" : "Retiro"} exitosa!`
          });
        } catch (innerErr: any) {
          console.error("Error finalizing bank action:", innerErr);
        }
      }, 1500);

    } catch (err: any) {
      console.error("Error in bank action:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Settle bets / End match
  app.post("/api/admin/simulate-match", verifyToken, requireRole(Role.ADMINISTRADOR), async (req, res) => {
    try {
      const { matchId, winner, homeScore, awayScore } = req.body;
      if (!matchId || !winner) {
        return res.status(400).json({ success: false, error: "Datos de simulación incompletos" });
      }

      const { settledCount, winnersPaid } = await settleMatchBets(
        matchId,
        winner as BetSide,
        Number(homeScore || 0),
        Number(awayScore || 0)
      );

      res.json({
        success: true,
        message: `Simulación exitosa. Se liquidaron ${settledCount} apuestas. ${winnersPaid} ganadores pagados.`
      });
    } catch (err: any) {
      console.error("Error in match simulation:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reset all matches to UPCOMING
  app.post("/api/admin/reset-matches", verifyToken, requireRole(Role.ADMINISTRADOR), async (req, res) => {
    try {
      await resetMatches();
      res.json({ success: true, message: "Partidos reiniciados con éxito." });
    } catch (err: any) {
      console.error("Error resetting matches:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- STATIC ASSETS FOR PRODUCTION ---
  if (process.env.SERVE_STATIC === "true" || process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    logger.info(`[API Server] Running on port ${PORT}`);
  });
}

startServer();
