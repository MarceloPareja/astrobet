import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  runTransaction
} from "firebase/firestore";
import { db } from "./firebase";
import { randomUUID } from "crypto";
import { User as AppUser, Match, Bet, Transaction, MatchStatus, BetStatus, BetSide } from "../src/types";
import { INITIAL_MATCHES } from "../src/data/initialMatches";

// Helper collection references
const usersCol = collection(db, "users");
const matchesCol = collection(db, "matches");
const betsCol = collection(db, "bets");
const txsCol = collection(db, "transactions");

// --- USER OPERATIONS ---
export async function getUserByUsername(username: string): Promise<AppUser | null> {
  const q = query(usersCol, where("username", "==", username.trim().toLowerCase()));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const docSnap = querySnapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as AppUser;
}

export async function getUserById(userId: string): Promise<AppUser | null> {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as AppUser;
}

export async function createUser(user: AppUser): Promise<void> {
  const docRef = doc(db, "users", user.id);
  const userData: any = {
    username: user.username.trim().toLowerCase(),
    fullName: user.fullName,
    email: user.email,
    balance: user.balance,
    role: user.role || 'apostador',
    bankDetails: user.bankDetails
  };
  if (user.password) {
    userData.password = user.password;
  }
  await setDoc(docRef, userData);
}

export async function updateUserBalance(userId: string, newBalance: number): Promise<void> {
  const docRef = doc(db, "users", userId);
  await updateDoc(docRef, { balance: Number(newBalance.toFixed(4)) });
}

// --- MATCH OPERATIONS ---
export async function getMatches(): Promise<Match[]> {
  const querySnapshot = await getDocs(matchesCol);
  if (querySnapshot.empty) {
    // Auto-initialize matches if empty
    await initializeMatches();
    const freshSnapshot = await getDocs(matchesCol);
    return freshSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Match[];
  }
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Match[];
}

export async function initializeMatches(): Promise<void> {
  for (const m of INITIAL_MATCHES) {
    const docRef = doc(db, "matches", m.id);
    await setDoc(docRef, m);
  }
}

export async function resetMatches(): Promise<void> {
  for (const m of INITIAL_MATCHES) {
    const docRef = doc(db, "matches", m.id);
    await setDoc(docRef, {
      ...m,
      status: MatchStatus.UPCOMING,
      winner: null,
      score: null
    });
  }
}

export async function updateMatch(matchId: string, fields: Partial<Match>): Promise<void> {
  const docRef = doc(db, "matches", matchId);
  await updateDoc(docRef, fields);
}

export async function createMatch(match: Match): Promise<void> {
  const docRef = doc(db, "matches", match.id);
  await setDoc(docRef, match);
}

// --- BET OPERATIONS ---
export async function getBets(userId?: string): Promise<Bet[]> {
  let q = query(betsCol);
  if (userId) {
    q = query(betsCol, where("userId", "==", userId));
  }
  const querySnapshot = await getDocs(q);
  const results = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Bet[];
  return results.sort((a, b) => b.id.localeCompare(a.id));
}

export async function createBet(bet: Bet): Promise<void> {
  const docRef = doc(db, "bets", bet.id);
  await setDoc(docRef, bet);
}

// --- TRANSACTION OPERATIONS ---
export async function getTransactions(userId?: string): Promise<Transaction[]> {
  let q = query(txsCol);
  if (userId) {
    q = query(txsCol, where("userId", "==", userId));
  }
  const querySnapshot = await getDocs(q);
  const results = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Transaction[];
  return results.sort((a, b) => b.id.localeCompare(a.id));
}

export async function createTransaction(tx: Transaction): Promise<void> {
  const docRef = doc(db, "transactions", tx.id);
  await setDoc(docRef, tx);
}

// --- SETTLEMENT CONTROLLER ---
export async function settleMatchBets(
  matchId: string, 
  winner: BetSide, 
  homeScore: number, 
  awayScore: number
): Promise<{ settledCount: number; winnersPaid: number }> {
  const matchRef = doc(db, "matches", matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists()) {
    throw new Error("Match not found");
  }

  const match = { id: matchSnap.id, ...matchSnap.data() } as Match;

  // 1. Update match state
  await updateDoc(matchRef, {
    status: MatchStatus.FINISHED,
    winner: winner,
    score: { home: homeScore, away: awayScore }
  });

  // 2. Fetch all pending bets for this match
  const q = query(betsCol, where("matchId", "==", matchId), where("status", "==", BetStatus.PENDING));
  const betSnapshot = await getDocs(q);
  const pendingBets = betSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Bet[];

  let settledCount = 0;
  let winnersPaid = 0;

  for (const bet of pendingBets) {
    const isWinner = bet.side === winner;
    const finalStatus = isWinner ? BetStatus.WON : BetStatus.LOST;

    // Update bet status
    const betRef = doc(db, "bets", bet.id);
    await updateDoc(betRef, { status: finalStatus });
    settledCount++;

    if (isWinner) {
      // Fetch user to pay out
      const userRef = doc(db, "users", bet.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const user = userSnap.data() as AppUser;
        const payoutAmount = bet.potentialPayout;
        const newBalance = Number((user.balance + payoutAmount).toFixed(4));
        
        await updateDoc(userRef, { balance: newBalance });
        winnersPaid++;

        // Create transaction log
        const payoutTx: Transaction = {
          id: 'tx_' + crypto.randomUUID(),
          userId: bet.userId,
          type: 'WIN_PAYOUT',
          amount: payoutAmount,
          description: `¡Premio ganado! Retorno de apuesta sobre ${bet.side === BetSide.LEFT ? match.homeTeam : match.awayTeam} (cuotas ratio 1:${match.oddsRatio})`,
          createdAt: new Date().toLocaleString()
        };
        const txRef = doc(db, "transactions", payoutTx.id);
        await setDoc(txRef, payoutTx);
      }
    }
  }

  return { settledCount, winnersPaid };
}
