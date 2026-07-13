export enum BetSide {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export enum MatchStatus {
  UPCOMING = 'UPCOMING',
  FINISHED = 'FINISHED'
}

export enum BetStatus {
  PENDING = 'PENDING',
  WON = 'WON',
  LOST = 'LOST'
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  holderName: string;
  routingNumber?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  balance: number;
  bankDetails?: BankDetails;
  password?: string;
  token?: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  oddsRatio: number; // The N in 1:N
  status: MatchStatus;
  winner?: BetSide; // LEFT = home, RIGHT = away
  startTime: string;
  score?: {
    home: number;
    away: number;
  };
}

export interface Bet {
  id: string;
  userId: string;
  matchId: string;
  matchInfo: {
    homeTeam: string;
    awayTeam: string;
    homeFlag: string;
    awayFlag: string;
    oddsRatio: number;
  };
  side: BetSide;
  amount: number;
  potentialPayout: number;
  status: BetStatus;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'WIN_PAYOUT' | 'BET_PLACE';
  amount: number;
  description: string;
  createdAt: string;
}
