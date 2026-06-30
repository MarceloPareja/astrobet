import React, { useState, useEffect } from 'react';
import {
  Wallet,
  DollarSign,
  CreditCard,
  LogOut,
  Plus,
  RotateCcw,
  Check,
  CheckCircle,
  TrendingUp,
  Tv,
  User,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Award,
  Activity,
  Terminal,
  Shield,
  Info,
  Coins,
  Database,
  Coffee,
  UserPlus,
  ChevronRight,
  Settings,
  Flame,
  AlertCircle
} from 'lucide-react';
import { BetSide, MatchStatus, BetStatus, User as AppUser, Match, Bet, Transaction, BankDetails } from './types';
import { INITIAL_MATCHES } from './data/initialMatches';
import JuniorDevNotes from './components/JuniorDevNotes';

export default function App() {
  // --- STATE ---
  const [users, setUsers] = useState<AppUser[]>(() => {
    const stored = localStorage.getItem('astrobet_users');
    return stored ? JSON.parse(stored) : [];
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const stored = localStorage.getItem('astrobet_active_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const stored = localStorage.getItem('astrobet_matches');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('astrobet_matches', JSON.stringify(INITIAL_MATCHES));
    return INITIAL_MATCHES;
  });

  const [bets, setBets] = useState<Bet[]>(() => {
    const stored = localStorage.getItem('astrobet_bets');
    return stored ? JSON.parse(stored) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const stored = localStorage.getItem('astrobet_transactions');
    return stored ? JSON.parse(stored) : [];
  });

  // UI state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regBankName, setRegBankName] = useState('AstroBank');
  const [regAccountNumber, setRegAccountNumber] = useState('');
  const [regHolderName, setRegHolderName] = useState('');
  const [regError, setRegError] = useState('');

  // Main screen navigation/filters
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');
  const [activeAccountTab, setActiveAccountTab] = useState<'BETS_ACTIVE' | 'BETS_HISTORY' | 'BANK' | 'TRANSACTIONS'>('BETS_ACTIVE');

  // Bet placement state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedSide, setSelectedSide] = useState<BetSide | null>(null);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [betSuccessMsg, setBetSuccessMsg] = useState('');
  const [betErrorMsg, setBetErrorMsg] = useState('');

  // Bank form state
  const [depositAmount, setDepositAmount] = useState<string>('100');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('50');
  const [bankProcessing, setBankProcessing] = useState(false);
  const [bankActionType, setBankActionType] = useState<'DEPOSIT' | 'WITHDRAWAL' | null>(null);
  const [bankMessage, setBankMessage] = useState('');

  // Admin/Debug simulator state
  const [adminSelectedMatchId, setAdminSelectedMatchId] = useState<string>('');
  const [adminWinner, setAdminWinner] = useState<BetSide>(BetSide.LEFT);
  const [adminHomeScore, setAdminHomeScore] = useState<number>(2);
  const [adminAwayScore, setAdminAwayScore] = useState<number>(1);
  const [adminMessage, setAdminMessage] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    localStorage.setItem('astrobet_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('astrobet_active_user', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('astrobet_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('astrobet_bets', JSON.stringify(bets));
  }, [bets]);

  useEffect(() => {
    localStorage.setItem('astrobet_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Clear errors when toggling modes
  useEffect(() => {
    setLoginError('');
    setRegError('');
  }, [authMode]);

  // Update default account holder name when Full Name changes during registration
  useEffect(() => {
    setRegHolderName(regFullName);
  }, [regFullName]);

  // Autocomplete test data
  const handleAutocompleteTestData = () => {
    setRegUsername('astrorider');
    setRegFullName('Juan Pérez');
    setRegEmail('juan.perez@astro.com');
    setRegBankName('Banco de la Galaxia');
    setRegAccountNumber('ES12 3456 7890 1234 5678');
    setRegHolderName('Juan Pérez');
  };

  // --- ACTIONS ---

  // Register
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regUsername || !regFullName || !regEmail || !regBankName || !regAccountNumber || !regHolderName) {
      setRegError('Por favor, completa todos los campos, incluyendo los datos bancarios.');
      return;
    }

    // Check if username already exists
    const exists = users.find(u => u.username.toLowerCase() === regUsername.toLowerCase());
    if (exists) {
      setRegError('El nombre de usuario ya está registrado.');
      return;
    }

    const newUser: AppUser = {
      id: 'u_' + Date.now(),
      username: regUsername.trim(),
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      balance: 500.00, // Initial bonus
      bankDetails: {
        bankName: regBankName,
        accountNumber: regAccountNumber,
        holderName: regHolderName
      }
    };

    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    
    // Add transaction for welcome bonus
    const initialTx: Transaction = {
      id: 'tx_' + Date.now(),
      userId: newUser.id,
      type: 'DEPOSIT',
      amount: 500.00,
      description: 'Bono Inicial de Bienvenida AstroBet 🚀',
      createdAt: new Date().toLocaleString()
    };
    setTransactions(prev => [initialTx, ...prev]);

    setToastMessage(`¡Bienvenido ${newUser.fullName}! Recibiste $500.00 de bono inicial.`);
    
    // Clean fields
    setRegUsername('');
    setRegFullName('');
    setRegEmail('');
    setRegAccountNumber('');
    setRegHolderName('');
  };

  // Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername) {
      setLoginError('Por favor introduce tu usuario.');
      return;
    }

    const user = users.find(u => u.username.toLowerCase() === loginUsername.trim().toLowerCase());
    if (!user) {
      setLoginError('El usuario no existe. ¡Regístrate si eres nuevo!');
      return;
    }

    setCurrentUser(user);
    setToastMessage(`¡Hola de nuevo, ${user.fullName}!`);
    setLoginUsername('');
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedMatch(null);
    setSelectedSide(null);
    setBetSuccessMsg('');
    setBetErrorMsg('');
  };

  // Select odd for betting
  const handleSelectOdd = (match: Match, side: BetSide) => {
    if (match.status === MatchStatus.FINISHED) return;
    setSelectedMatch(match);
    setSelectedSide(side);
    setBetSuccessMsg('');
    setBetErrorMsg('');
  };

  // Calculate potential payout based on updated user request ratio formulas:
  // Now includes the original bet amount plus the calculated return of the bet (Bet + Bet * Ratio)
  // Left return: Apuesta + Apuesta * N
  // Right return: Apuesta + Apuesta * 1/N
  const calculatePotentialPayout = (oddsRatio: number, side: BetSide, amount: number): number => {
    if (isNaN(amount) || amount <= 0) return 0;
    if (side === BetSide.LEFT) {
      return amount + (amount * oddsRatio);
    } else {
      return amount + (amount * (1 / oddsRatio));
    }
  };

  // Place a bet
  const handlePlaceBet = (e: React.FormEvent) => {
    e.preventDefault();
    setBetSuccessMsg('');
    setBetErrorMsg('');

    if (!currentUser) {
      setBetErrorMsg('Debes iniciar sesión para apostar.');
      return;
    }

    if (!selectedMatch || !selectedSide) {
      setBetErrorMsg('Selecciona un partido y un lado para apostar.');
      return;
    }

    if (betAmount <= 0) {
      setBetErrorMsg('El monto debe ser mayor que cero.');
      return;
    }

    if (currentUser.balance < betAmount) {
      setBetErrorMsg('Saldo insuficiente. Ve a la sección del Banco para depositar.');
      return;
    }

    const payout = calculatePotentialPayout(selectedMatch.oddsRatio, selectedSide, betAmount);

    const newBet: Bet = {
      id: 'bet_' + Date.now(),
      userId: currentUser.id,
      matchId: selectedMatch.id,
      matchInfo: {
        homeTeam: selectedMatch.homeTeam,
        awayTeam: selectedMatch.awayTeam,
        homeFlag: selectedMatch.homeFlag,
        awayFlag: selectedMatch.awayFlag,
        oddsRatio: selectedMatch.oddsRatio
      },
      side: selectedSide,
      amount: betAmount,
      potentialPayout: Number(payout.toFixed(4)),
      status: BetStatus.PENDING,
      createdAt: new Date().toLocaleString()
    };

    // Deduct balance
    const updatedUser = {
      ...currentUser,
      balance: Number((currentUser.balance - betAmount).toFixed(4))
    };

    // Save
    setBets(prev => [newBet, ...prev]);
    setCurrentUser(updatedUser);
    
    // Update users array
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    // Create bet transaction
    const betTx: Transaction = {
      id: 'tx_b_' + Date.now(),
      userId: currentUser.id,
      type: 'BET_PLACE',
      amount: betAmount,
      description: `Apuesta colocada al ${selectedSide === BetSide.LEFT ? selectedMatch.homeTeam : selectedMatch.awayTeam} (${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam})`,
      createdAt: new Date().toLocaleString()
    };
    setTransactions(prev => [betTx, ...prev]);

    setBetSuccessMsg(`¡Apuesta de $${betAmount.toFixed(2)} colocada con éxito!`);
    setToastMessage('Apuesta registrada. ¡Que el algoritmo esté de tu lado!');
    
    // Clear selection
    setSelectedMatch(null);
    setSelectedSide(null);
  };

  // Simulating deposit/withdrawal
  const handleBankAction = (type: 'DEPOSIT' | 'WITHDRAWAL') => {
    if (!currentUser) return;
    setBankMessage('');

    const amountNum = parseFloat(type === 'DEPOSIT' ? depositAmount : withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setBankMessage('Por favor ingresa un monto válido.');
      return;
    }

    if (type === 'WITHDRAWAL' && currentUser.balance < amountNum) {
      setBankMessage('Saldo insuficiente en tu billetera de apuestas para retirar.');
      return;
    }

    setBankProcessing(true);
    setBankActionType(type);

    // Simulated network latency
    setTimeout(() => {
      let finalBalance = currentUser.balance;
      let txDesc = '';

      if (type === 'DEPOSIT') {
        finalBalance += amountNum;
        txDesc = `Depósito recibido desde ${currentUser.bankDetails?.bankName || 'Banco Vinculado'}`;
      } else {
        finalBalance -= amountNum;
        txDesc = `Retiro enviado a ${currentUser.bankDetails?.bankName || 'Banco Vinculado'}`;
      }

      const updatedUser = {
        ...currentUser,
        balance: Number(finalBalance.toFixed(4))
      };

      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

      // Add transaction
      const bankTx: Transaction = {
        id: 'tx_bk_' + Date.now(),
        userId: currentUser.id,
        type: type,
        amount: amountNum,
        description: txDesc,
        createdAt: new Date().toLocaleString()
      };
      setTransactions(prev => [bankTx, ...prev]);

      setBankProcessing(false);
      setBankActionType(null);
      setBankMessage(`¡Operación exitosa! $${amountNum.toFixed(2)} procesados.`);
      setToastMessage(type === 'DEPOSIT' ? `Depósito de $${amountNum.toFixed(2)} acreditado` : `Retiro de $${amountNum.toFixed(2)} transferido`);
      
      // Clear forms
      if (type === 'DEPOSIT') setDepositAmount('100');
      else setWithdrawAmount('50');
    }, 1500);
  };

  // Simulating match completion and settling bets (Admin panel action)
  const handleSimulateMatchEnd = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMessage('');

    if (!adminSelectedMatchId) {
      setAdminMessage('Selecciona un partido para finalizar.');
      return;
    }

    const matchToSettle = matches.find(m => m.id === adminSelectedMatchId);
    if (!matchToSettle) {
      setAdminMessage('Partido no encontrado.');
      return;
    }

    if (matchToSettle.status === MatchStatus.FINISHED) {
      setAdminMessage('Este partido ya fue finalizado.');
      return;
    }

    // Mark match as finished
    const updatedMatches = matches.map(m => {
      if (m.id === adminSelectedMatchId) {
        return {
          ...m,
          status: MatchStatus.FINISHED,
          winner: adminWinner,
          score: {
            home: adminWinner === BetSide.LEFT ? Math.max(adminHomeScore, adminAwayScore) : Math.min(adminHomeScore, adminAwayScore),
            away: adminWinner === BetSide.RIGHT ? Math.max(adminHomeScore, adminAwayScore) : Math.min(adminHomeScore, adminAwayScore)
          }
        };
      }
      return m;
    });

    setMatches(updatedMatches);

    // Settle all pending bets for this match
    const pendingBetsForMatch = bets.filter(b => b.matchId === adminSelectedMatchId && b.status === BetStatus.PENDING);
    
    let updatedBets = [...bets];
    let usersMap = new Map<string, AppUser>(users.map(u => [u.id, { ...u }]));

    pendingBetsForMatch.forEach(bet => {
      const won = bet.side === adminWinner;
      const finalStatus = won ? BetStatus.WON : BetStatus.LOST;

      // Update bet
      updatedBets = updatedBets.map(b => b.id === bet.id ? { ...b, status: finalStatus } : b);

      if (won) {
        // Pay user
        const betUser = usersMap.get(bet.userId);
        if (betUser) {
          betUser.balance = Number((betUser.balance + bet.potentialPayout).toFixed(4));
          usersMap.set(bet.userId, betUser);

          // Create payout transaction log
          const payoutTx: Transaction = {
            id: 'tx_pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            userId: bet.userId,
            type: 'WIN_PAYOUT',
            amount: bet.potentialPayout,
            description: `¡Premio ganado! Retorno de apuesta sobre ${bet.side === BetSide.LEFT ? matchToSettle.homeTeam : matchToSettle.awayTeam} (cuotas ratio 1:${matchToSettle.oddsRatio})`,
            createdAt: new Date().toLocaleString()
          };
          setTransactions(prev => [payoutTx, ...prev]);

          // Update active currentUser if it's the one who won
          if (currentUser && currentUser.id === bet.userId) {
            currentUser.balance = Number((currentUser.balance + bet.potentialPayout).toFixed(4));
            setCurrentUser({ ...currentUser });
          }
        }
      }
    });

    setBets(updatedBets);
    setUsers(Array.from(usersMap.values()));

    setAdminMessage(`¡Partido finalizado con éxito! El ganador fue ${adminWinner === BetSide.LEFT ? matchToSettle.homeTeam : matchToSettle.awayTeam}. Se liquidaron ${pendingBetsForMatch.length} apuestas.`);
    setToastMessage('¡Partido liquidado! Revisa los balances.');
    
    // Clear selection
    setAdminSelectedMatchId('');
  };

  // Reset Matches to UPCOMING to allow testing again
  const handleResetMatches = () => {
    setMatches(INITIAL_MATCHES);
    setToastMessage('Estados de partidos reiniciados a pendientes.');
  };

  // Filter matches based on criteria
  const filteredMatches = matches.filter(m => {
    if (matchFilter === 'UPCOMING') return m.status === MatchStatus.UPCOMING;
    if (matchFilter === 'FINISHED') return m.status === MatchStatus.FINISHED;
    return true;
  });

  // Calculate active bets statistics
  const activeBets = bets.filter(b => b.userId === currentUser?.id && b.status === BetStatus.PENDING);
  const historicBets = bets.filter(b => b.userId === currentUser?.id && b.status !== BetStatus.PENDING);
  const userTransactions = transactions.filter(t => t.userId === currentUser?.id);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-light font-sans relative pb-16">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div id="app-toast" className="fixed top-5 right-5 z-50 bg-gradient-to-r from-brand-red to-brand-dark-red text-white py-3 px-5 rounded-lg shadow-2xl flex items-center gap-3 border border-white/20 animate-bounce glow-red font-display font-medium text-sm">
          <Award className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Background stars canvas aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-red rounded-full blur-3xl filter opacity-30"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-brand-dark-red rounded-full blur-3xl filter opacity-20"></div>
      </div>

      {/* HEADER PREMIUM */}
      <header id="app-header" className="border-b border-brand-gray/50 glass-panel py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="bg-brand-red p-2.5 rounded-xl glow-red">
              <span className="font-display font-black text-2xl tracking-widest text-brand-light">A★B</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-2xl tracking-tight text-brand-light">ASTRO<span className="text-brand-red">BET</span></h1>
                <span className="bg-brand-red/10 text-brand-red text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-brand-red/30 animate-pulse">LIVE ENGINE v1.02</span>
              </div>
              <p className="text-xs text-brand-light/60 font-mono">Diseñado por "Mateo" (Junior Dev Core)</p>
            </div>
          </div>

          {/* User Info / State */}
          {currentUser ? (
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Linked Bank Badge */}
              <div className="hidden lg:flex items-center gap-2 bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs">
                <Shield className="w-3.5 h-3.5" />
                <span className="font-medium">Banco Vinculado: <strong className="font-bold">{currentUser.bankDetails?.bankName}</strong></span>
              </div>

              {/* Balance Widget */}
              <div className="flex items-center gap-3 bg-brand-gray/30 border border-brand-gray/50 p-1.5 pl-4 rounded-xl">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-mono tracking-wider text-brand-light/60">Saldo Disponible</p>
                  <p className="font-mono font-bold text-lg text-brand-light">${currentUser.balance.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-brand-red to-brand-dark-red p-2.5 rounded-lg glow-red-sm text-white">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              {/* Profile/Logout */}
              <div className="flex items-center gap-2">
                <div className="text-left hidden sm:block">
                  <p className="font-semibold text-xs text-brand-light">{currentUser.fullName}</p>
                  <p className="text-[10px] text-brand-light/60 font-mono">@{currentUser.username}</p>
                </div>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="bg-brand-gray/40 hover:bg-brand-red hover:text-white border border-brand-gray text-brand-light p-2.5 rounded-xl transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-brand-light/60 font-mono bg-brand-gray/20 border border-brand-gray/40 px-4 py-2 rounded-xl">
              <Info className="w-4 h-4 text-brand-red shrink-0" />
              <span>Inicia sesión o regístrate para empezar a operar con dinero ficticio.</span>
            </div>
          )}

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 mt-8 relative z-10">
        
        {!currentUser ? (
          /* ================= LOGIN / REGISTER VIEW ================= */
          <div className="max-w-md mx-auto mt-12 bg-brand-bg/85 glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10 glow-red">
            
            {/* Tab selector */}
            <div className="flex border-b border-brand-gray/40">
              <button
                id="select-login-tab"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-4 text-center font-display font-semibold text-sm transition-all duration-200 ${authMode === 'login' ? 'bg-brand-red/10 text-brand-red border-b-2 border-brand-red' : 'text-brand-light/50 hover:text-brand-light'}`}
              >
                Ingresar a AstroBet
              </button>
              <button
                id="select-register-tab"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-4 text-center font-display font-semibold text-sm transition-all duration-200 ${authMode === 'register' ? 'bg-brand-red/10 text-brand-red border-b-2 border-brand-red' : 'text-brand-light/50 hover:text-brand-light'}`}
              >
                Registro de Cuenta
              </button>
            </div>

            <div className="p-8">
              
              {/* BRAND BRIEF HEADER */}
              <div className="text-center mb-6">
                <div className="inline-block bg-brand-red/10 text-brand-red font-mono text-xs px-3 py-1 rounded-full border border-brand-red/20 mb-2">
                  🔒 Conexión Encriptada de Pruebas
                </div>
                <h2 className="font-display font-black text-2xl uppercase tracking-wider text-brand-light">
                  {authMode === 'login' ? 'Bienvenido Apostador' : 'Crea tu Identidad'}
                </h2>
                <p className="text-xs text-brand-light/60 mt-1">
                  {authMode === 'login' 
                    ? 'Introduce tu usuario de pruebas registrado.' 
                    : 'Regístrate incluyendo tus datos bancarios simulados.'}
                </p>
              </div>

              {/* REGISTER FORM */}
              {authMode === 'register' ? (
                <form id="register-form" onSubmit={handleRegister} className="space-y-4">
                  {regError && (
                    <div className="bg-brand-red/10 border border-brand-red text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Test Data Helper */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAutocompleteTestData}
                      className="text-[10px] font-mono text-brand-red hover:underline flex items-center gap-1 border border-brand-red/30 px-2 py-1 rounded bg-brand-red/5"
                    >
                      <Plus className="w-3 h-3" /> Autocompletar con Datos Ficticios
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-brand-light/70 uppercase mb-1">Nombre de Usuario (Login)</label>
                    <input
                      type="text"
                      placeholder="ej: astrorider, messi10"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 text-sm focus:outline-none focus:border-brand-red font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-brand-light/70 uppercase mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="ej: Juan Pérez"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 text-sm focus:outline-none focus:border-brand-red"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-brand-light/70 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="ej: juan@astro.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 text-sm focus:outline-none focus:border-brand-red font-mono"
                    />
                  </div>

                  {/* BANKING BLOC */}
                  <div className="border border-brand-red/20 bg-brand-red/5 rounded-2xl p-4 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-4 h-4 text-brand-red" />
                      <h4 className="font-display font-bold text-xs uppercase tracking-wide text-brand-light">Información Bancaria Requerida</h4>
                    </div>
                    <p className="text-[10px] text-brand-light/70 mb-3 leading-relaxed">
                      Necesitamos tu cuenta para simular depósitos de crédito y retiros automáticos de premios.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Banco / Entidad Financiera</label>
                        <select
                          value={regBankName}
                          onChange={(e) => setRegBankName(e.target.value)}
                          className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-red"
                        >
                          <option value="AstroBank">AstroBank (Banco Oficial)</option>
                          <option value="Antigravity Trust">Antigravity Trust</option>
                          <option value="Sabadell Ficticio">Sabadell Ficticio</option>
                          <option value="Santander Pruebas">Santander Pruebas</option>
                          <option value="BBVA Fake">BBVA Fake</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Número de Cuenta / IBAN / CLABE</label>
                        <input
                          type="text"
                          placeholder="ej: ES12 3456 7890 1234 5678"
                          value={regAccountNumber}
                          onChange={(e) => setRegAccountNumber(e.target.value)}
                          className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-red font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Titular de la Cuenta</label>
                        <input
                          type="text"
                          placeholder="Nombre del Titular"
                          value={regHolderName}
                          onChange={(e) => setRegHolderName(e.target.value)}
                          className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-red"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-brand-red to-brand-dark-red hover:opacity-95 text-brand-light py-3 rounded-xl font-display font-semibold transition-all duration-200 glow-red mt-6 cursor-pointer"
                  >
                    Crear Cuenta y Recibir $500 🚀
                  </button>
                </form>
              ) : (
                /* LOGIN FORM */
                <form id="login-form" onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <div className="bg-brand-red/10 border border-brand-red text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {users.length > 0 && (
                    <div className="bg-brand-gray/20 rounded-xl p-3 border border-brand-gray/30 mb-2">
                      <p className="text-[11px] font-mono text-brand-light/60 mb-1">Usuarios registrados en tu equipo:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {users.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setLoginUsername(u.username)}
                            className="bg-brand-bg text-brand-light hover:bg-brand-red/20 text-[10px] font-mono px-2 py-1 rounded border border-brand-gray hover:border-brand-red transition-all"
                          >
                            @{u.username}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-brand-light/70 uppercase mb-1">Nombre de tu Usuario</label>
                    <input
                      type="text"
                      placeholder="Ingresa tu username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 text-sm focus:outline-none focus:border-brand-red font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-brand-red to-brand-dark-red hover:opacity-95 text-brand-light py-3 rounded-xl font-display font-semibold transition-all duration-200 glow-red mt-4 cursor-pointer"
                  >
                    Ingresar con Seguridad Falsa 🗝️
                  </button>

                  <div className="text-center mt-4">
                    <p className="text-xs text-brand-light/50">¿No tienes cuenta?</p>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-xs text-brand-red hover:underline font-semibold mt-1"
                    >
                      Regístrate ahora mismo
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        ) : (
          /* ================= APP DASHBOARD ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1: SPORTS FEED (8 COLS on large screens, or 7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Filter Row and Welcome Bar */}
              <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div>
                  <h3 className="font-display font-extrabold text-base uppercase tracking-tight text-brand-light">🏆 Cartelera de Partidos</h3>
                  <p className="text-xs text-brand-light/60">Haz clic en un lado (Local o Visitante) para agregar al boleto de apuestas.</p>
                </div>
                
                {/* Filters */}
                <div className="flex bg-brand-bg border border-brand-gray rounded-xl p-1 shrink-0">
                  <button
                    id="filter-all"
                    onClick={() => setMatchFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${matchFilter === 'ALL' ? 'bg-brand-red text-white' : 'text-brand-light/60 hover:text-brand-light'}`}
                  >
                    Todos
                  </button>
                  <button
                    id="filter-upcoming"
                    onClick={() => setMatchFilter('UPCOMING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${matchFilter === 'UPCOMING' ? 'bg-brand-red text-white' : 'text-brand-light/60 hover:text-brand-light'}`}
                  >
                    Próximos / En Vivo
                  </button>
                  <button
                    id="filter-finished"
                    onClick={() => setMatchFilter('FINISHED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${matchFilter === 'FINISHED' ? 'bg-brand-red text-white' : 'text-brand-light/60 hover:text-brand-light'}`}
                  >
                    Finalizados
                  </button>
                </div>
              </div>

              {/* Matches List Grid */}
              <div className="space-y-4">
                {filteredMatches.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-8 text-center text-brand-light/60">
                    <Tv className="w-12 h-12 mx-auto text-brand-gray mb-3 animate-pulse" />
                    <p className="font-semibold">No se encontraron partidos para este filtro.</p>
                    <p className="text-xs mt-1">Usa la consola debug o reinicia los partidos.</p>
                  </div>
                ) : (
                  filteredMatches.map(match => {
                    const isFinished = match.status === MatchStatus.FINISHED;
                    const isSelectedLeft = selectedMatch?.id === match.id && selectedSide === BetSide.LEFT;
                    const isSelectedRight = selectedMatch?.id === match.id && selectedSide === BetSide.RIGHT;

                    return (
                      <div
                        key={match.id}
                        className={`glass-panel rounded-2xl p-5 border transition-all duration-200 ${
                          isFinished 
                            ? 'opacity-80 border-brand-gray/20' 
                            : 'hover:border-brand-red/30 border-white/5'
                        } ${selectedMatch?.id === match.id ? 'border-brand-red glow-red-sm' : ''}`}
                      >
                        {/* Match Info Header */}
                        <div className="flex items-center justify-between mb-4 border-b border-brand-gray/20 pb-2.5">
                          <div className="flex items-center gap-2">
                            {isFinished ? (
                              <span className="bg-brand-gray text-white text-[10px] font-mono px-2 py-0.5 rounded uppercase">FINALIZADO</span>
                            ) : match.oddsRatio === 1000 ? (
                              <span className="bg-brand-red text-white text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold animate-pulse flex items-center gap-1">
                                <Activity className="w-3 h-3 animate-spin" /> EN VIVO ASIMÉTRICO
                              </span>
                            ) : (
                              <span className="bg-brand-red/10 text-brand-red border border-brand-red/30 text-[10px] font-mono px-2 py-0.5 rounded uppercase">EN CORSO</span>
                            )}
                            <span className="text-xs text-brand-light/60 font-mono flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-brand-light/40" /> {match.startTime}
                            </span>
                          </div>

                          {/* Extra odds hint label for UX */}
                          <div className="text-xs font-mono text-brand-light/40">
                            Ratio Cuotas: <strong className="text-brand-light font-bold">1:{match.oddsRatio}</strong>
                          </div>
                        </div>

                        {/* Teams Content Grid */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          
                          {/* Left Team (Home) Block */}
                          <div className="flex-1 flex items-center justify-end gap-3 text-right w-full sm:w-auto">
                            <div>
                              <p className="font-display font-bold text-base text-brand-light">{match.homeTeam}</p>
                              <span className="text-xs text-brand-light/50">Local</span>
                            </div>
                            <span className="text-3xl bg-brand-gray/20 p-2 rounded-xl border border-white/5">{match.homeFlag}</span>
                          </div>

                          {/* Center Score / Versus Area */}
                          <div className="shrink-0 text-center bg-brand-gray/10 px-4 py-2 rounded-xl border border-white/5 font-mono min-w-[70px]">
                            {isFinished && match.score ? (
                              <div className="text-lg font-bold text-brand-red">
                                {match.score.home} - {match.score.away}
                              </div>
                            ) : (
                              <div className="text-xs font-bold text-brand-light/50">VS</div>
                            )}
                          </div>

                          {/* Right Team (Away) Block */}
                          <div className="flex-1 flex items-center justify-start gap-3 text-left w-full sm:w-auto">
                            <span className="text-3xl bg-brand-gray/20 p-2 rounded-xl border border-white/5">{match.awayFlag}</span>
                            <div>
                              <p className="font-display font-bold text-base text-brand-light">{match.awayTeam}</p>
                              <span className="text-xs text-brand-light/50">Visitante</span>
                            </div>
                          </div>

                        </div>

                        {/* BETTING SELECTOR BUTTONS (Left / Right) */}
                        {!isFinished ? (
                          <div className="grid grid-cols-2 gap-3 mt-5">
                            
                            {/* LEFT Team Bet Option Button */}
                            <button
                              id={`bet-odd-left-${match.id}`}
                              onClick={() => handleSelectOdd(match, BetSide.LEFT)}
                              className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                isSelectedLeft
                                  ? 'bg-brand-red/20 border-brand-red text-brand-light'
                                  : 'bg-brand-gray/10 hover:bg-brand-gray/20 border-white/5 text-brand-light/90'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold tracking-wider uppercase text-brand-light/70">Apostar Local</span>
                                <span className="bg-brand-red/10 text-brand-red text-xs px-2 py-0.5 rounded font-mono font-bold border border-brand-red/20">
                                  {match.oddsRatio.toFixed(1)}x Paga
                                </span>
                              </div>
                              <p className="text-xs font-semibold mt-1 truncate">Victoria de {match.homeTeam}</p>
                            </button>

                            {/* RIGHT Team Bet Option Button */}
                            <button
                              id={`bet-odd-right-${match.id}`}
                              onClick={() => handleSelectOdd(match, BetSide.RIGHT)}
                              className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                isSelectedRight
                                  ? 'bg-brand-red/20 border-brand-red text-brand-light'
                                  : 'bg-brand-gray/10 hover:bg-brand-gray/20 border-white/5 text-brand-light/90'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold tracking-wider uppercase text-brand-light/70">Apostar Vis.</span>
                                <span className="bg-brand-red/10 text-brand-red text-xs px-2 py-0.5 rounded font-mono font-bold border border-brand-red/20">
                                  {(1 / match.oddsRatio).toFixed(5)}x Paga
                                </span>
                              </div>
                              <p className="text-xs font-semibold mt-1 truncate">Victoria de {match.awayTeam}</p>
                            </button>

                          </div>
                        ) : (
                          <div className="bg-brand-gray/10 rounded-xl p-3 mt-4 text-center border border-white/5">
                            <p className="text-xs font-mono text-brand-light/60">
                              Ganador del partido: <strong className="text-brand-red font-bold">{match.winner === BetSide.LEFT ? match.homeTeam : match.awayTeam}</strong>
                            </p>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>

              {/* JUNIOR DEV CHEAT / EMERGENCY RESET */}
              <div className="glass-panel rounded-2xl p-4 border border-brand-red/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-brand-red" />
                  <span className="text-xs font-mono text-brand-light/80">¿Te quedaste sin partidos o quieres re-testear?</span>
                </div>
                <button
                  id="reset-matches-btn"
                  onClick={handleResetMatches}
                  className="bg-brand-gray/20 hover:bg-brand-gray/40 text-brand-light px-3 py-1.5 rounded-lg text-xs font-mono border border-brand-gray/50 active:scale-95 transition-all"
                >
                  Reiniciar Partidos 🔄
                </button>
              </div>

            </div>

            {/* COLUMN 2 & 3: SLIP / SIMULATION ADMIN / MY WALLET (5 COLS on large screens, or 5) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* ================= SECTION A: SELECTED BET SLIP ================= */}
              <div className="glass-panel rounded-3xl p-6 border border-brand-red/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red rounded-full blur-3xl filter opacity-10 pointer-events-none"></div>

                <div className="flex items-center gap-2 mb-4">
                  <Coins className="w-5 h-5 text-brand-red" />
                  <h3 className="font-display font-extrabold text-lg uppercase tracking-tight text-brand-light">🎫 Boleto de Apuestas</h3>
                </div>

                {selectedMatch && selectedSide ? (
                  <form id="bet-form" onSubmit={handlePlaceBet} className="space-y-4">
                    
                    {/* Bet Info summary */}
                    <div className="bg-brand-gray/20 border border-brand-gray/40 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-brand-light/60">Selección Activa</p>
                          <h4 className="font-display font-extrabold text-sm text-brand-light mt-0.5">
                            {selectedSide === BetSide.LEFT ? selectedMatch.homeTeam : selectedMatch.awayTeam}
                          </h4>
                        </div>
                        <span className="bg-brand-red text-white text-xs font-mono font-bold px-2.5 py-1 rounded">
                          {selectedSide === BetSide.LEFT ? 'Local (LEFT)' : 'Visitante (RIGHT)'}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-brand-gray/20 text-xs flex justify-between items-center">
                        <span className="text-brand-light/60">Partido:</span>
                        <span className="font-semibold">{selectedMatch.homeTeam} vs {selectedMatch.awayTeam}</span>
                      </div>

                      <div className="mt-1 flex justify-between items-center text-xs">
                        <span className="text-brand-light/60">Ratio de cuota del partido:</span>
                        <span className="font-mono font-bold text-brand-red">1 : {selectedMatch.oddsRatio}</span>
                      </div>
                    </div>

                    {/* Math Explainer Box from Junior Dev */}
                    <div className="bg-brand-red/5 border border-brand-red/10 rounded-xl p-3 text-xs space-y-1 text-brand-light/80">
                      <p className="font-mono text-[10px] font-bold text-brand-red uppercase">📐 Fórmula de Retorno Matemática:</p>
                      {selectedSide === BetSide.LEFT ? (
                        <p className="font-mono text-[11px]">
                          Lado Izquierdo (Local): <strong className="text-brand-light font-bold">Apuesta + (Apuesta * N)</strong> <br />
                          Fórmula: <code className="bg-brand-bg px-1 rounded text-yellow-400">Apuesta + (Apuesta * {selectedMatch.oddsRatio})</code>
                        </p>
                      ) : (
                        <p className="font-mono text-[11px]">
                          Lado Derecho (Visitante): <strong className="text-brand-light font-bold">Apuesta + (Apuesta * 1/N)</strong> <br />
                          Fórmula: <code className="bg-brand-bg px-1 rounded text-yellow-400">Apuesta + (Apuesta * {(1 / selectedMatch.oddsRatio).toFixed(6)})</code>
                        </p>
                      )}
                    </div>

                    {/* Amount Input */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-mono text-brand-light/70 uppercase">Monto a Apostar ($)</label>
                        <span className="text-xs text-brand-light/50 font-mono">Saldo: ${currentUser.balance.toFixed(2)}</span>
                      </div>
                      
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-light/40 font-mono font-semibold">$</span>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={betAmount}
                          onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 pl-7 text-sm focus:outline-none focus:border-brand-red font-mono font-semibold text-brand-light"
                        />
                      </div>

                      {/* Quick select buttons */}
                      <div className="flex gap-1.5 mt-2">
                        {[10, 50, 100, 200, 500].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setBetAmount(val)}
                            className="flex-1 bg-brand-gray/10 hover:bg-brand-gray/30 text-brand-light/80 text-[10px] font-mono py-1 rounded border border-white/5 transition"
                          >
                            +${val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Result Calculation Preview */}
                    <div className="bg-brand-gray/10 rounded-xl p-3 border border-white/5 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase font-mono tracking-wider text-brand-light/50">Retorno Potencial Estimado</p>
                        <p className="text-xs text-brand-light/60 font-mono">Acreditación instantánea si ganas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-lg text-green-400">
                          ${calculatePotentialPayout(selectedMatch.oddsRatio, selectedSide, betAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </p>
                        <p className="text-[10px] font-mono text-brand-light/40">Pago Total</p>
                      </div>
                    </div>

                    {betErrorMsg && (
                      <div className="bg-brand-red/10 border border-brand-red text-red-400 p-2.5 rounded-lg text-xs">
                        {betErrorMsg}
                      </div>
                    )}

                    {betSuccessMsg && (
                      <div className="bg-green-500/10 border border-green-500 text-green-400 p-2.5 rounded-lg text-xs">
                        {betSuccessMsg}
                      </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-brand-red to-brand-dark-red hover:opacity-95 text-white py-3 rounded-xl font-display font-semibold transition-all duration-150 glow-red cursor-pointer text-sm"
                      >
                        Confirmar Apuesta Deportiva 🚀
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSelectedMatch(null); setSelectedSide(null); }}
                        className="bg-brand-gray/20 hover:bg-brand-gray/40 border border-brand-gray text-brand-light p-3 rounded-xl transition"
                      >
                        X
                      </button>
                    </div>

                  </form>
                ) : (
                  <div className="text-center py-10 bg-brand-bg/50 border border-dashed border-brand-gray/40 rounded-2xl">
                    <TrendingUp className="w-12 h-12 mx-auto text-brand-gray mb-2.5 animate-pulse" />
                    <p className="font-semibold text-sm text-brand-light">Tu boleto está vacío</p>
                    <p className="text-xs text-brand-light/60 px-4 mt-1">
                      Busca un partido en vivo o programado y selecciona tu cuota preferida para simular una apuesta.
                    </p>
                  </div>
                )}
              </div>

              {/* ================= SECTION B: PORTAL ADMIN DE SIMULACIÓN DE FINALES ================= */}
              <div className="glass-panel rounded-3xl p-6 border border-brand-red/20 relative">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-5 h-5 text-brand-red" />
                  <h3 className="font-display font-extrabold text-base uppercase tracking-tight text-brand-light">⚙️ Panel Simulador de Resultados (Debug)</h3>
                </div>
                <p className="text-xs text-brand-light/60 mb-4 leading-relaxed">
                  Dado que no hay partidos reales jugándose ahora mismo, el Dev Junior programó esta consola para simular la conclusión del partido de forma instantánea. ¡Ideal para verificar los retornos matemáticos 1:N!
                </p>

                <form id="simulate-form" onSubmit={handleSimulateMatchEnd} className="space-y-4">
                  
                  {/* Match select */}
                  <div>
                    <label className="block text-xs font-mono text-brand-light/70 uppercase mb-1">Selecciona Partido a Terminar</label>
                    <select
                      value={adminSelectedMatchId}
                      onChange={(e) => {
                        setAdminSelectedMatchId(e.target.value);
                        const m = matches.find(match => match.id === e.target.value);
                        if (m) {
                          // set standard winner
                          setAdminWinner(BetSide.LEFT);
                        }
                      }}
                      className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-red"
                    >
                      <option value="">-- Elige un partido pendiente --</option>
                      {matches.filter(m => m.status === MatchStatus.UPCOMING).map(m => (
                        <option key={m.id} value={m.id}>
                          {m.homeTeam} vs {m.awayTeam} (Ratio 1:{m.oddsRatio})
                        </option>
                      ))}
                    </select>
                  </div>

                  {adminSelectedMatchId && (
                    <div className="space-y-3 bg-brand-gray/10 p-3.5 rounded-xl border border-white/5">
                      
                      {/* Set Winner */}
                      <div>
                        <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Elegir Ganador del Encuentro</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAdminWinner(BetSide.LEFT)}
                            className={`py-2 px-3 rounded-lg text-xs font-mono font-bold border transition ${
                              adminWinner === BetSide.LEFT 
                                ? 'bg-brand-red text-white border-brand-red' 
                                : 'bg-brand-bg text-brand-light/70 border-brand-gray hover:text-brand-light'
                            }`}
                          >
                            LADO IZQ (LOCAL)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminWinner(BetSide.RIGHT)}
                            className={`py-2 px-3 rounded-lg text-xs font-mono font-bold border transition ${
                              adminWinner === BetSide.RIGHT 
                                ? 'bg-brand-red text-white border-brand-red' 
                                : 'bg-brand-bg text-brand-light/70 border-brand-gray hover:text-brand-light'
                            }`}
                          >
                            LADO DER (VISITANTE)
                          </button>
                        </div>
                      </div>

                      {/* Set Scores */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Goles Local</label>
                          <input
                            type="number"
                            min="0"
                            value={adminHomeScore}
                            onChange={(e) => setAdminHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2 text-xs text-center font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Goles Visitante</label>
                          <input
                            type="number"
                            min="0"
                            value={adminAwayScore}
                            onChange={(e) => setAdminAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2 text-xs text-center font-mono font-bold"
                          />
                        </div>
                      </div>

                    </div>
                  )}

                  {adminMessage && (
                    <div className="bg-brand-red/10 border border-brand-red text-brand-light p-2.5 rounded-lg text-xs">
                      {adminMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!adminSelectedMatchId}
                    className="w-full bg-brand-gray/30 border border-brand-gray hover:bg-brand-red hover:border-brand-red hover:text-white text-brand-light py-2.5 rounded-xl text-xs font-mono font-bold transition disabled:opacity-50 disabled:hover:bg-brand-gray/30 disabled:hover:border-brand-gray disabled:hover:text-brand-light"
                  >
                    Simular Final de Partido y Settle Bets 🏁
                  </button>
                </form>
              </div>

              {/* ================= SECTION C: MI CUENTA / CONTROL DE BANCO ================= */}
              <div className="glass-panel rounded-3xl p-6 border border-brand-gray/40">
                
                {/* Tabs */}
                <div className="flex border-b border-brand-gray/40 mb-4 gap-1">
                  <button
                    id="tab-active-bets"
                    onClick={() => setActiveAccountTab('BETS_ACTIVE')}
                    className={`flex-1 pb-2 text-center text-xs font-semibold transition ${activeAccountTab === 'BETS_ACTIVE' ? 'text-brand-red border-b-2 border-brand-red font-bold' : 'text-brand-light/50 hover:text-brand-light'}`}
                  >
                    Apuestas Activas ({activeBets.length})
                  </button>
                  <button
                    id="tab-history-bets"
                    onClick={() => setActiveAccountTab('BETS_HISTORY')}
                    className={`flex-1 pb-2 text-center text-xs font-semibold transition ${activeAccountTab === 'BETS_HISTORY' ? 'text-brand-red border-b-2 border-brand-red font-bold' : 'text-brand-light/50 hover:text-brand-light'}`}
                  >
                    Historial ({historicBets.length})
                  </button>
                  <button
                    id="tab-bank"
                    onClick={() => setActiveAccountTab('BANK')}
                    className={`flex-1 pb-2 text-center text-xs font-semibold transition ${activeAccountTab === 'BANK' ? 'text-brand-red border-b-2 border-brand-red font-bold' : 'text-brand-light/50 hover:text-brand-light'}`}
                  >
                    Banco 🏦
                  </button>
                  <button
                    id="tab-tx"
                    onClick={() => setActiveAccountTab('TRANSACTIONS')}
                    className={`flex-1 pb-2 text-center text-xs font-semibold transition ${activeAccountTab === 'TRANSACTIONS' ? 'text-brand-red border-b-2 border-brand-red font-bold' : 'text-brand-light/50 hover:text-brand-light'}`}
                  >
                    Transac. ({userTransactions.length})
                  </button>
                </div>

                {/* TAB DETAILS RENDERING */}
                <div className="min-h-[220px]">
                  
                  {/* APUESTAS ACTIVAS */}
                  {activeAccountTab === 'BETS_ACTIVE' && (
                    <div className="space-y-3">
                      {activeBets.length === 0 ? (
                        <div className="text-center py-8 text-brand-light/40">
                          <Activity className="w-8 h-8 mx-auto mb-2 text-brand-gray opacity-45" />
                          <p className="text-xs">No tienes apuestas pendientes.</p>
                          <p className="text-[10px] mt-0.5">Selecciona cuotas del feed para empezar.</p>
                        </div>
                      ) : (
                        activeBets.map(bet => (
                          <div key={bet.id} className="bg-brand-gray/10 border border-white/5 rounded-xl p-3 flex flex-col justify-between gap-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-brand-light">
                                {bet.side === BetSide.LEFT ? bet.matchInfo.homeTeam : bet.matchInfo.awayTeam}
                              </span>
                              <span className="bg-brand-red/10 border border-brand-red/20 text-brand-red text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                                Ratio 1:{bet.matchInfo.oddsRatio}
                              </span>
                            </div>
                            <p className="text-[10px] text-brand-light/60 mt-0.5">{bet.matchInfo.homeTeam} vs {bet.matchInfo.awayTeam}</p>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-brand-gray/20 text-xs">
                              <span className="text-[11px] text-brand-light/60">Apostado: <strong className="font-mono text-brand-light">${bet.amount.toFixed(2)}</strong></span>
                              <span className="text-[11px] text-green-400 font-medium">Retorno: <strong className="font-mono">${bet.potentialPayout.toFixed(4)}</strong></span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* HISTORIAL DE APUESTAS (LIQUIDADAS) */}
                  {activeAccountTab === 'BETS_HISTORY' && (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {historicBets.length === 0 ? (
                        <div className="text-center py-8 text-brand-light/40">
                          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-brand-gray opacity-45" />
                          <p className="text-xs">Aún no hay apuestas liquidadas.</p>
                          <p className="text-[10px] mt-0.5">Usa la consola debug para finalizar un partido.</p>
                        </div>
                      ) : (
                        historicBets.map(bet => {
                          const won = bet.status === BetStatus.WON;
                          return (
                            <div key={bet.id} className={`bg-brand-gray/10 border rounded-xl p-3 flex flex-col justify-between gap-1 ${won ? 'border-green-500/20 bg-green-500/5' : 'border-brand-gray/20'}`}>
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-brand-light">
                                  {bet.side === BetSide.LEFT ? bet.matchInfo.homeTeam : bet.matchInfo.awayTeam}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                  won ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-brand-gray/30 text-brand-light/50'
                                }`}>
                                  {won ? 'GANADO' : 'PERDIDO'}
                                </span>
                              </div>
                              <p className="text-[10px] text-brand-light/60 mt-0.5">{bet.matchInfo.homeTeam} vs {bet.matchInfo.awayTeam}</p>
                              <div className="flex justify-between items-center mt-2 pt-2 border-t border-brand-gray/20 text-xs">
                                <span className="text-[11px] text-brand-light/60">Apuesta: <strong className="font-mono text-brand-light">${bet.amount.toFixed(2)}</strong></span>
                                {won ? (
                                  <span className="text-[11px] text-green-400 font-bold font-mono">+${bet.potentialPayout.toFixed(4)}</span>
                                ) : (
                                  <span className="text-[11px] text-brand-light/40 font-bold font-mono">$0.00</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* BANCO SIMULADOR (ASTROBANK) */}
                  {activeAccountTab === 'BANK' && (
                    <div className="space-y-4">
                      
                      {/* Linked bank details layout card */}
                      <div className="bg-brand-gray/20 rounded-xl p-3.5 border border-white/5 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CreditCard className="w-4 h-4 text-brand-red" />
                          <span className="text-xs font-mono font-bold tracking-wide text-brand-light/80">CUENTA DE ORIGEN VINCULADA</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <p className="text-brand-light/60">Banco: <strong className="text-brand-light">{currentUser.bankDetails?.bankName}</strong></p>
                          <p className="text-brand-light/60">Nro Cuenta: <strong className="text-brand-light font-mono">{currentUser.bankDetails?.accountNumber}</strong></p>
                          <p className="text-brand-light/60">Titular: <strong className="text-brand-light">{currentUser.bankDetails?.holderName}</strong></p>
                        </div>
                      </div>

                      {/* Transaction forms */}
                      <div className="grid grid-cols-2 gap-3">
                        
                        {/* Deposit Area */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-brand-light/60 uppercase">Depositar Crédito</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-light/40 text-[10px] font-mono font-bold">$</span>
                            <input
                              type="number"
                              min="1"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              className="w-full bg-brand-bg border border-brand-gray rounded-lg p-1.5 pl-6 text-xs font-mono font-semibold"
                            />
                          </div>
                          <button
                            id="deposit-btn"
                            disabled={bankProcessing}
                            onClick={() => handleBankAction('DEPOSIT')}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-1.5 rounded-lg text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            Depositar
                          </button>
                        </div>

                        {/* Withdrawal Area */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-mono text-brand-light/60 uppercase">Retirar Fondos</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-light/40 text-[10px] font-mono font-bold">$</span>
                            <input
                              type="number"
                              min="1"
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              className="w-full bg-brand-bg border border-brand-gray rounded-lg p-1.5 pl-6 text-xs font-mono font-semibold"
                            />
                          </div>
                          <button
                            id="withdraw-btn"
                            disabled={bankProcessing}
                            onClick={() => handleBankAction('WITHDRAWAL')}
                            className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-semibold py-1.5 rounded-lg text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            Retirar
                          </button>
                        </div>

                      </div>

                      {/* Loading status representation */}
                      {bankProcessing && (
                        <div className="bg-brand-red/5 border border-brand-red/20 p-3 rounded-lg flex items-center gap-3">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-red"></span>
                          </span>
                          <span className="text-[11px] font-mono animate-pulse">
                            {bankActionType === 'DEPOSIT' 
                              ? 'Procesando transferencia bancaria simulada...' 
                              : 'Enviando retiro simulado a tu cuenta nacional...'}
                          </span>
                        </div>
                      )}

                      {bankMessage && !bankProcessing && (
                        <div className="bg-brand-gray/20 border border-brand-gray/50 p-2.5 rounded-lg text-xs text-center">
                          {bankMessage}
                        </div>
                      )}

                    </div>
                  )}

                  {/* TRANSACCIONES BANCARIAS */}
                  {activeAccountTab === 'TRANSACTIONS' && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {userTransactions.length === 0 ? (
                        <div className="text-center py-8 text-brand-light/40">
                          <Database className="w-8 h-8 mx-auto mb-2 text-brand-gray opacity-45" />
                          <p className="text-xs">No hay transacciones registradas.</p>
                          <p className="text-[10px] mt-0.5">Realiza depósitos o apuestas para generar registros.</p>
                        </div>
                      ) : (
                        userTransactions.map(tx => {
                          const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'WIN_PAYOUT';
                          return (
                            <div key={tx.id} className="bg-brand-gray/10 border border-white/5 rounded-xl p-2.5 flex justify-between items-center gap-2">
                              <div>
                                <p className="text-xs font-semibold leading-snug">{tx.description}</p>
                                <p className="text-[9px] text-brand-light/50 mt-0.5 font-mono">{tx.createdAt}</p>
                              </div>
                              <span className={`text-xs font-mono font-bold shrink-0 ${isDeposit ? 'text-green-400' : 'text-brand-red'}`}>
                                {isDeposit ? '+' : '-'}${tx.amount.toFixed(2)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-brand-gray/40 mt-16 py-6 text-center text-xs text-brand-light/40">
        <p>© 2026 AstroBet S.A. Todos los derechos simulados reservados.</p>
        <p className="mt-1 font-mono text-[10px]">Hecho con fines de testeo y simulación de ratios 1:N.</p>
      </footer>

      {/* FLOAT DEV LOGS */}
      <JuniorDevNotes />

    </div>
  );
}
