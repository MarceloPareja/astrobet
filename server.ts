import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  getUserByUsername,
  getUserById,
  createUser,
  updateUserBalance,
  getMatches,
  resetMatches,
  updateMatch,
  getBets,
  createBet,
  getTransactions,
  createTransaction,
  settleMatchBets
} from "./src/server/dbOperations";
import { User as AppUser, Bet, Transaction, BetSide, MatchStatus, BetStatus } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // Get user profile/balance
  app.get("/api/users/:userId", async (req, res) => {
    try {
      const user = await getUserById(req.params.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }
      res.json({ success: true, user });
    } catch (err: any) {
      console.error("Error fetching user:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Register user
  app.post("/api/register", async (req, res) => {
    try {
      const { username, fullName, email, bankDetails } = req.body;
      if (!username || !fullName || !email || !bankDetails) {
        return res.status(400).json({ success: false, error: "Datos de registro incompletos" });
      }

      const existingUser = await getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ success: false, error: "El nombre de usuario ya existe" });
      }

      const userId = "u_" + Date.now();
      const newUser: AppUser = {
        id: userId,
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        email: email.trim(),
        balance: 500.00, // Welcome bonus
        bankDetails
      };

      await createUser(newUser);

      // Create welcome bonus transaction
      const welcomeTx: Transaction = {
        id: "tx_" + Date.now(),
        userId: newUser.id,
        type: "DEPOSIT",
        amount: 500.00,
        description: "Bono Inicial de Bienvenida AstroBet 🚀",
        createdAt: new Date().toLocaleString()
      };
      await createTransaction(welcomeTx);

      res.json({ success: true, user: newUser });
    } catch (err: any) {
      console.error("Error in registration:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Login user
  app.post("/api/login", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ success: false, error: "Usuario requerido" });
      }

      const user = await getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ success: false, error: "El usuario no existe" });
      }

      res.json({ success: true, user });
    } catch (err: any) {
      console.error("Error in login:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Place bet
  app.post("/api/bets", async (req, res) => {
    try {
      const { userId, matchId, matchInfo, side, amount, potentialPayout } = req.body;
      if (!userId || !matchId || !matchInfo || !side || !amount) {
        return res.status(400).json({ success: false, error: "Datos de apuesta incompletos" });
      }

      const user = await getUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "Usuario no encontrado" });
      }

      const amountNum = Number(amount);
      if (user.balance < amountNum) {
        return res.status(400).json({ success: false, error: "Saldo insuficiente" });
      }

      // Deduct balance
      const newBalance = Number((user.balance - amountNum).toFixed(4));
      await updateUserBalance(userId, newBalance);

      // Create bet
      const betId = "bet_" + Date.now();
      const newBet: Bet = {
        id: betId,
        userId,
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
        id: "tx_b_" + Date.now(),
        userId,
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
  app.get("/api/bets/:userId", async (req, res) => {
    try {
      const bets = await getBets(req.params.userId);
      res.json({ success: true, bets });
    } catch (err: any) {
      console.error("Error fetching user bets:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get user's transactions
  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const transactions = await getTransactions(req.params.userId);
      res.json({ success: true, transactions });
    } catch (err: any) {
      console.error("Error fetching user transactions:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Simulated deposit/withdrawal with backend latency
  app.post("/api/bank-action", async (req, res) => {
    try {
      const { userId, type, amount } = req.body;
      if (!userId || !type || !amount) {
        return res.status(400).json({ success: false, error: "Datos bancarios incompletos" });
      }

      const user = await getUserById(userId);
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

      // Simulate network latency (1.5 seconds) as Mateo did!
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
          await updateUserBalance(userId, finalBalanceFixed);

          // Add transaction record
          const bankTx: Transaction = {
            id: "tx_bk_" + Date.now(),
            userId,
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
          // Standard server fallback if error occurs inside timeout
        }
      }, 1500);

    } catch (err: any) {
      console.error("Error in bank action:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Settle bets / End match
  app.post("/api/admin/simulate-match", async (req, res) => {
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
  app.post("/api/admin/reset-matches", async (req, res) => {
    try {
      await resetMatches();
      res.json({ success: true, message: "Partidos reiniciados con éxito." });
    } catch (err: any) {
      console.error("Error resetting matches:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- VITE MIDDLEWARE / STATIC ASSETS ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
