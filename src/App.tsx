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
import { BetSide, MatchStatus, BetStatus, Role, User as AppUser, Match, Bet, Transaction, BankDetails } from './types';
import JuniorDevNotes from './components/JuniorDevNotes';

export default function App() {
  // --- STATE ---
  const [users, setUsers] = useState<AppUser[]>(() => {
    const stored = localStorage.getItem('astrobet_users');
    return stored ? JSON.parse(stored) : [];
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const stored = localStorage.getItem('astrobet_active_user');
    const parsed = stored ? JSON.parse(stored) : null;
    if (parsed && !parsed.role) parsed.role = Role.APOSTADOR;
    return parsed;
  });

  const [matches, setMatches] = useState<Match[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // UI state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
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

  // Admin Match Creation State
  const [adminTab, setAdminTab] = useState<'SIMULATE' | 'CREATE'>('SIMULATE');
  const [adminHomeTeam, setAdminHomeTeam] = useState('');
  const [adminAwayTeam, setAdminAwayTeam] = useState('');
  const [adminHomeFlag, setAdminHomeFlag] = useState('⚽');
  const [adminAwayFlag, setAdminAwayFlag] = useState('⚽');
  const [adminOddsRatio, setAdminOddsRatio] = useState<number>(2.0);
  const [adminStartTime, setAdminStartTime] = useState('Hoy, 20:00');
  const [adminCreateMessage, setAdminCreateMessage] = useState('');
  const [adminCreateError, setAdminCreateError] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');

  // --- API OPERATIONS ---
  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (data.success) {
        setMatches(data.matches);
      }
    } catch (e) {
      console.error("Error fetching matches from API:", e);
    }
  };

  const fetchUserData = async (userId: string, token?: string) => {
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Fetch profile & balance
      const userRes = await fetch(`/api/users/${userId}`, { headers });
      const userData = await userRes.json();
      if (userData.success) {
        if (token) userData.user.token = token;
        setCurrentUser(userData.user);
        // Save current state as active user backup
        localStorage.setItem('astrobet_active_user', JSON.stringify(userData.user));
      }

      // Fetch bets
      const betsRes = await fetch(`/api/bets/${userId}`, { headers });
      const betsData = await betsRes.json();
      if (betsData.success) {
        setBets(betsData.bets);
      }

      // Fetch transactions
      const txsRes = await fetch(`/api/transactions/${userId}`, { headers });
      const txsData = await txsRes.json();
      if (txsData.success) {
        setTransactions(txsData.transactions);
      }
    } catch (e) {
      console.error("Error fetching user data from API:", e);
    }
  };

  // On mount: load matches
  useEffect(() => {
    fetchMatches();
  }, []);

  // Polling data for real-time live engine updates
  useEffect(() => {
    if (currentUser) {
      fetchUserData(currentUser.id, currentUser.token);
      const interval = setInterval(() => {
        fetchMatches();
        fetchUserData(currentUser.id, currentUser.token);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.id, currentUser?.token]);

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
    setRegPassword('Astro1234!');
    setRegFullName('Juan Pérez');
    setRegEmail('juan.perez@astro.com');
    setRegBankName('Banco de la Galaxia');
    setRegAccountNumber('ES12 3456 7890 1234 5678');
    setRegHolderName('Juan Pérez');
  };

  // --- ACTIONS ---

  // Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regUsername || !regFullName || !regEmail || !regBankName || !regAccountNumber || !regHolderName || !regPassword) {
      setRegError('Por favor, completa todos los campos, incluyendo la contraseña y los datos bancarios.');
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          password: regPassword.trim(),
          fullName: regFullName.trim(),
          email: regEmail.trim(),
          bankDetails: {
            bankName: regBankName,
            accountNumber: regAccountNumber,
            holderName: regHolderName
          }
        })
      });

      const data = await res.json();
      if (!data.success) {
        setRegError(data.error || 'Ocurrió un error al registrar.');
        return;
      }

      // Add to local registered users backup list for easy dev selection
      const updatedUsersList = [...users.filter(u => u.username !== data.user.username), data.user];
      setUsers(updatedUsersList);
      localStorage.setItem('astrobet_users', JSON.stringify(updatedUsersList));

      setCurrentUser(data.user);
      localStorage.setItem('astrobet_active_user', JSON.stringify(data.user));

      setToastMessage(`¡Bienvenido ${data.user.fullName}! Bono de $500.00 acreditado en Firebase.`);
      
      // Clean fields
      setRegUsername('');
      setRegPassword('');
      setRegFullName('');
      setRegEmail('');
      setRegAccountNumber('');
      setRegHolderName('');
    } catch (err) {
      setRegError('Error de red al conectar con Firebase.');
    }
  };

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername || !loginPassword) {
      setLoginError('Por favor introduce tu usuario y contraseña.');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: loginUsername.trim(),
          password: loginPassword.trim()
        })
      });

      const data = await res.json();
      if (!data.success) {
        setLoginError(data.error || 'El usuario no existe.');
        return;
      }

      // Sync local users selection list
      const updatedUsersList = [...users.filter(u => u.username !== data.user.username), data.user];
      setUsers(updatedUsersList);
      localStorage.setItem('astrobet_users', JSON.stringify(updatedUsersList));

      setCurrentUser(data.user);
      localStorage.setItem('astrobet_active_user', JSON.stringify(data.user));

      setToastMessage(`¡Hola de nuevo, ${data.user.fullName}! Datos cargados de Firebase.`);
      setLoginUsername('');
      setLoginPassword('');
    } catch (err) {
      setLoginError('Error de red al conectar con Firebase.');
    }
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('astrobet_active_user');
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
  const handlePlaceBet = async (e: React.FormEvent) => {
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

    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
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
          potentialPayout: Number(payout.toFixed(4))
        })
      });

      const data = await res.json();
      if (!data.success) {
        setBetErrorMsg(data.error || 'Error al procesar la apuesta.');
        return;
      }

      // Re-fetch user data to sync immediately
      await fetchUserData(currentUser.id);

      setBetSuccessMsg(`¡Apuesta de $${betAmount.toFixed(2)} colocada y guardada en Firestore!`);
      setToastMessage('Apuesta registrada en la Nube 🌌');
      
      // Clear selection
      setSelectedMatch(null);
      setSelectedSide(null);
    } catch (err) {
      setBetErrorMsg('Error de conexión.');
    }
  };

  // Simulating deposit/withdrawal via API
  const handleBankAction = async (type: 'DEPOSIT' | 'WITHDRAWAL') => {
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

    try {
      const res = await fetch('/api/bank-action', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          userId: currentUser.id,
          type,
          amount: amountNum
        })
      });

      const data = await res.json();
      if (!data.success) {
        setBankMessage(data.error || 'Error en la operación bancaria.');
        setBankProcessing(false);
        setBankActionType(null);
        return;
      }

      // Re-fetch user data
      await fetchUserData(currentUser.id);

      setBankProcessing(false);
      setBankActionType(null);
      setBankMessage(data.message || `¡Operación exitosa! $${amountNum.toFixed(2)} procesados.`);
      setToastMessage(type === 'DEPOSIT' ? `Depósito de $${amountNum.toFixed(2)} acreditado` : `Retiro de $${amountNum.toFixed(2)} transferido`);
      
      // Clear forms
      if (type === 'DEPOSIT') setDepositAmount('100');
      else setWithdrawAmount('50');
    } catch (err) {
      setBankMessage('Error al conectar con el servidor bancario.');
      setBankProcessing(false);
      setBankActionType(null);
    }
  };

  // Simulating match completion and settling bets in Firebase
  const handleSimulateMatchEnd = async (e: React.FormEvent) => {
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

    try {
      const res = await fetch('/api/admin/simulate-match', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({
          matchId: adminSelectedMatchId,
          winner: adminWinner,
          homeScore: adminWinner === BetSide.LEFT ? Math.max(adminHomeScore, adminAwayScore) : Math.min(adminHomeScore, adminAwayScore),
          awayScore: adminWinner === BetSide.RIGHT ? Math.max(adminHomeScore, adminAwayScore) : Math.min(adminHomeScore, adminAwayScore)
        })
      });

      const data = await res.json();
      if (!data.success) {
        setAdminMessage(data.error || 'Error al simular partido.');
        return;
      }

      // Refresh all state
      await fetchMatches();
      if (currentUser) {
        await fetchUserData(currentUser.id);
      }

      setAdminMessage(data.message);
      setToastMessage('¡Resultados de Firestore liquidados!');
      
      // Clear selection
      setAdminSelectedMatchId('');
    } catch (err) {
      setAdminMessage('Error al conectar con la consola de administración.');
    }
  };

  // Create match in Firebase
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreateError('');
    setAdminCreateMessage('');

    if (!adminHomeTeam || !adminAwayTeam || !adminHomeFlag || !adminAwayFlag || !adminOddsRatio || !adminStartTime) {
      setAdminCreateError('Por favor completa todos los campos.');
      return;
    }

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`
        },
        body: JSON.stringify({
          homeTeam: adminHomeTeam,
          awayTeam: adminAwayTeam,
          homeFlag: adminHomeFlag,
          awayFlag: adminAwayFlag,
          oddsRatio: adminOddsRatio,
          startTime: adminStartTime
        })
      });

      const data = await res.json();
      if (!data.success) {
        setAdminCreateError(data.error || 'Error al crear partido.');
      } else {
        setAdminCreateMessage('¡Partido creado con éxito en Firestore!');
        // Clear form
        setAdminHomeTeam('');
        setAdminAwayTeam('');
        setAdminHomeFlag('⚽');
        setAdminAwayFlag('⚽');
        setAdminOddsRatio(2.0);
        setAdminStartTime('Hoy, 20:00');
        // Refresh match list immediately
        fetchMatches();
      }
    } catch (err) {
      setAdminCreateError('Error de red al conectar con el servidor.');
    }
  };

  // Reset Matches in Firebase
  const handleResetMatches = async () => {
    try {
      const res = await fetch('/api/admin/reset-matches', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser?.token}` }
      });
      const data = await res.json();
      if (data.success) {
        await fetchMatches();
        setToastMessage('Estados de partidos reiniciados en Firebase.');
      } else {
        setToastMessage('Error al reiniciar.');
      }
    } catch (err) {
      setToastMessage('Error de red.');
    }
  };

  // Filter matches based on criteria
  const filteredMatches = matches.filter(m => {
    if (matchFilter === 'UPCOMING') return m.status === MatchStatus.UPCOMING;
    if (matchFilter === 'FINISHED') return m.status === MatchStatus.FINISHED;
    return true;
  });

  // Calculate active bets statistics
  const activeBets = bets.filter(b => b.status === BetStatus.PENDING);
  const historicBets = bets.filter(b => b.status !== BetStatus.PENDING);

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
                <span className="bg-brand-red/10 text-brand-red text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-brand-red/30 animate-pulse">FIREBASE ONLINE</span>
              </div>
              <p className="text-xs text-brand-light/60 font-mono">Diseñado por "Mateo" (Junior Frontend Dev + Firestore Integrator)</p>
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
                  <span className={`text-[9px] font-mono font-bold uppercase ${currentUser.role === Role.ADMINISTRADOR ? 'text-yellow-400' : currentUser.role === Role.AUDITOR ? 'text-blue-400' : 'text-green-400'}`}>
                    {currentUser.role}
                  </span>
                </div>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="bg-brand-gray/40 hover:bg-brand-red hover:text-white border border-brand-gray text-brand-light p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-brand-light/60 font-mono bg-brand-gray/20 border border-brand-gray/40 px-4 py-2 rounded-xl">
              <Info className="w-4 h-4 text-brand-red shrink-0" />
              <span>Inicia sesión o regístrate para empezar a operar con dinero ficticio en Firebase.</span>
            </div>
          )}

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 mt-8 relative z-10">
        
        {!currentUser ? (
          /* ================= LOGIN / REGISTER VIEW ================= */
          <div className="max-w-md mx-auto mt-12 bg-brand-bg/85 glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10 glow-red animate-fade-in">
            
            {/* Tab selector */}
            <div className="flex border-b border-brand-gray/40">
              <button
                id="select-login-tab"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-4 text-center font-display font-semibold text-sm transition-all duration-200 cursor-pointer ${authMode === 'login' ? 'bg-brand-red/10 text-brand-red border-b-2 border-brand-red' : 'text-brand-light/50 hover:text-brand-light'}`}
              >
                Ingresar a AstroBet
              </button>
              <button
                id="select-register-tab"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-4 text-center font-display font-semibold text-sm transition-all duration-200 cursor-pointer ${authMode === 'register' ? 'bg-brand-red/10 text-brand-red border-b-2 border-brand-red' : 'text-brand-light/50 hover:text-brand-light'}`}
              >
                Registro de Cuenta
              </button>
            </div>

            <div className="p-8">
              
              {/* BRAND BRIEF HEADER */}
              <div className="text-center mb-6">
                <div className="inline-block bg-brand-red/10 text-brand-red font-mono text-xs px-3 py-1 rounded-full border border-brand-red/20 mb-2">
                  🔒 Conexión Segura con Firebase
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
                      className="text-[10px] font-mono text-brand-red hover:underline flex items-center gap-1 border border-brand-red/30 px-2 py-1 rounded bg-brand-red/5 cursor-pointer"
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
                      className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 text-sm focus:outline-none focus:border-brand-red font-mono text-brand-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-brand-light/70 uppercase mb-1">Contraseña</label>
                    <input
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 text-sm focus:outline-none focus:border-brand-red font-mono text-brand-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-brand-light/70 uppercase mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      placeholder="ej: Juan Pérez"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 text-sm focus:outline-none focus:border-brand-red text-brand-light"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-brand-light/70 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="ej: juan@astro.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 text-sm focus:outline-none focus:border-brand-red font-mono text-brand-light"
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
                          className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-red text-brand-light"
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
                          className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-red font-mono text-brand-light"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Titular de la Cuenta</label>
                        <input
                          type="text"
                          placeholder="Nombre del Titular"
                          value={regHolderName}
                          onChange={(e) => setRegHolderName(e.target.value)}
                          className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2.5 text-xs focus:outline-none focus:border-brand-red text-brand-light"
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
                      <p className="text-[11px] font-mono text-brand-light/60 mb-1">Usuarios registrados en tu navegador:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {users.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setLoginUsername(u.username)}
                            className="bg-brand-bg text-brand-light hover:bg-brand-red/20 text-[10px] font-mono px-2 py-1 rounded border border-brand-gray hover:border-brand-red transition-all cursor-pointer"
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
                      className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 text-sm focus:outline-none focus:border-brand-red font-mono text-brand-light"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-mono text-brand-light/70 uppercase mb-1">Contraseña</label>
                    <input
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 text-sm focus:outline-none focus:border-brand-red font-mono text-brand-light"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-brand-red to-brand-dark-red hover:opacity-95 text-brand-light py-3 rounded-xl font-display font-semibold transition-all duration-200 glow-red mt-4 cursor-pointer"
                  >
                    Ingresar con Firebase Secure 🗝️
                  </button>

                  <div className="text-center mt-4">
                    <p className="text-xs text-brand-light/50">¿No tienes cuenta?</p>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-xs text-brand-red hover:underline font-semibold mt-1 cursor-pointer"
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
            
            {/* COLUMN 1: SPORTS FEED (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Filter Row and Welcome Bar */}
              <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div>
                  <h3 className="font-display font-extrabold text-base uppercase tracking-tight text-brand-light">🏆 Cartelera de Partidos (Firestore)</h3>
                  <p className="text-xs text-brand-light/60">Haz clic en un lado (Local o Visitante) para agregar al boleto de apuestas.</p>
                </div>
                
                {/* Filters */}
                <div className="flex bg-brand-bg border border-brand-gray rounded-xl p-1 shrink-0">
                  <button
                    id="filter-all"
                    onClick={() => setMatchFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${matchFilter === 'ALL' ? 'bg-brand-red text-white' : 'text-brand-light/60 hover:text-brand-light'}`}
                  >
                    Todos
                  </button>
                  <button
                    id="filter-upcoming"
                    onClick={() => setMatchFilter('UPCOMING')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${matchFilter === 'UPCOMING' ? 'bg-brand-red text-white' : 'text-brand-light/60 hover:text-brand-light'}`}
                  >
                    Próximos / En Vivo
                  </button>
                  <button
                    id="filter-finished"
                    onClick={() => setMatchFilter('FINISHED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${matchFilter === 'FINISHED' ? 'bg-brand-red text-white' : 'text-brand-light/60 hover:text-brand-light'}`}
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

                        {/* BETTING SELECTOR BUTTONS */}
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
                                  {(match.oddsRatio).toFixed(1)}x
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
                                  {(1 / match.oddsRatio).toFixed(5)}x
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
              {currentUser.role === Role.ADMINISTRADOR && (
              <div className="glass-panel rounded-2xl p-4 border border-brand-red/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-brand-red" />
                  <span className="text-xs font-mono text-brand-light/80">¿Te quedaste sin partidos o quieres re-testear?</span>
                </div>
                <button
                  id="reset-matches-btn"
                  onClick={handleResetMatches}
                  className="bg-brand-gray/20 hover:bg-brand-gray/40 text-brand-light px-3 py-1.5 rounded-lg text-xs font-mono border border-brand-gray/50 active:scale-95 transition-all cursor-pointer"
                >
                  Reiniciar Partidos 🔄
                </button>
              </div>
              )}

            </div>

            {/* COLUMN 2 & 3: SLIP / SIMULATION ADMIN / MY WALLET (5 COLS) */}
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
                          onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                          className="w-full bg-brand-bg border border-brand-gray rounded-xl p-3 pl-8 text-sm focus:outline-none focus:border-brand-red font-mono text-brand-light"
                          required
                        />
                      </div>
                    </div>

                    {/* Potential profit preview */}
                    <div className="bg-brand-gray/10 rounded-xl p-4 flex justify-between items-center border border-white/5">
                      <div>
                        <p className="text-[10px] uppercase font-mono tracking-wider text-brand-light/50">Retorno Neto de Apuesta</p>
                        <p className="text-[10px] text-brand-light/40 font-mono">(Apuesta + Retorno)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-mono font-bold text-green-400">
                          ${calculatePotentialPayout(selectedMatch.oddsRatio, selectedSide, betAmount).toFixed(4)}
                        </p>
                      </div>
                    </div>

                    {betErrorMsg && (
                      <div className="bg-brand-red/10 border border-brand-red text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{betErrorMsg}</span>
                      </div>
                    )}

                    {betSuccessMsg && (
                      <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded-xl text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{betSuccessMsg}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedMatch(null); setSelectedSide(null); }}
                        className="flex-1 bg-brand-gray/20 hover:bg-brand-gray/40 text-brand-light py-3 rounded-xl font-display font-semibold text-xs transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-[2] bg-gradient-to-r from-brand-red to-brand-dark-red hover:opacity-95 text-brand-light py-3 rounded-xl font-display font-semibold text-xs transition-all duration-200 glow-red cursor-pointer"
                      >
                        Confirmar Apuesta en Firebase 🛡️
                      </button>
                    </div>

                  </form>
                ) : (
                  <div className="bg-brand-gray/10 rounded-2xl p-8 text-center text-brand-light/50 border border-white/5">
                    <Coins className="w-10 h-10 mx-auto text-brand-gray mb-2.5 animate-bounce" />
                    <p className="text-sm font-semibold">Boleto de apuestas vacío.</p>
                    <p className="text-xs mt-1">Selecciona cualquier cuota de la cartelera de partidos para empezar.</p>
                  </div>
                )}

              </div>

              {/* ================= SECTION B: ACCOUNT PANEL tabs (BANK / BETS / TRANSACTIONS) ================= */}
              <div className="glass-panel rounded-3xl p-6 border border-white/5">
                
                {/* Tabs bar */}
                <div className="flex flex-wrap gap-1 border-b border-brand-gray/20 pb-3 mb-4">
                  <button
                    id="tab-active-bets"
                    onClick={() => setActiveAccountTab('BETS_ACTIVE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeAccountTab === 'BETS_ACTIVE' ? 'bg-brand-red text-white' : 'text-brand-light/60 hover:text-brand-light hover:bg-brand-gray/10'}`}
                  >
                    Activas ({activeBets.length})
                  </button>
                  <button
                    id="tab-history-bets"
                    onClick={() => setActiveAccountTab('BETS_HISTORY')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeAccountTab === 'BETS_HISTORY' ? 'bg-brand-red text-white' : 'text-brand-light/60 hover:text-brand-light hover:bg-brand-gray/10'}`}
                  >
                    Historial ({historicBets.length})
                  </button>
                  <button
                    id="tab-bank"
                    onClick={() => setActiveAccountTab('BANK')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeAccountTab === 'BANK' ? 'bg-brand-red text-white' : 'text-brand-light/60 hover:text-brand-light hover:bg-brand-gray/10'}`}
                  >
                    🏦 Banco Falso
                  </button>
                  <button
                    id="tab-txs"
                    onClick={() => setActiveAccountTab('TRANSACTIONS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeAccountTab === 'TRANSACTIONS' ? 'bg-brand-red text-white' : 'text-brand-light/60 hover:text-brand-light hover:bg-brand-gray/10'}`}
                  >
                    Extracto
                  </button>
                </div>

                {/* Tab content */}
                <div>
                  
                  {/* TAB 1: ACTIVE BETS */}
                  {activeAccountTab === 'BETS_ACTIVE' && (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {activeBets.length === 0 ? (
                        <div className="text-center py-6 text-brand-light/40 text-xs">
                          No tienes apuestas pendientes de resolución en Firebase.
                        </div>
                      ) : (
                        activeBets.map(bet => (
                          <div key={bet.id} className="bg-brand-gray/15 border border-brand-red/10 rounded-xl p-3 text-xs space-y-2 relative overflow-hidden">
                            <span className="absolute top-0 right-0 bg-yellow-500/10 text-yellow-500 px-2.5 py-0.5 rounded-bl font-mono text-[9px] font-bold">PENDIENTE</span>
                            
                            <div className="flex justify-between items-center pr-12">
                              <span className="font-bold text-brand-light">{bet.side === BetSide.LEFT ? bet.matchInfo.homeTeam : bet.matchInfo.awayTeam}</span>
                              <span className="text-[10px] font-mono text-brand-light/50">Monto: ${bet.amount.toFixed(2)}</span>
                            </div>

                            <div className="text-[11px] text-brand-light/70 flex justify-between items-center">
                              <span>{bet.matchInfo.homeTeam} vs {bet.matchInfo.awayTeam}</span>
                              <span className="font-mono text-green-400 font-semibold">Premio: ${bet.potentialPayout.toFixed(4)}</span>
                            </div>

                            <p className="text-[9px] text-brand-light/40 font-mono">ID: {bet.id} • {bet.createdAt}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 2: HISTORICAL BETS */}
                  {activeAccountTab === 'BETS_HISTORY' && (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {historicBets.length === 0 ? (
                        <div className="text-center py-6 text-brand-light/40 text-xs">
                          Tu historial de apuestas liquidadas en la nube está vacío.
                        </div>
                      ) : (
                        historicBets.map(bet => {
                          const isWon = bet.status === BetStatus.WON;
                          return (
                            <div key={bet.id} className={`bg-brand-gray/10 border rounded-xl p-3 text-xs space-y-1.5 relative overflow-hidden ${isWon ? 'border-green-500/20' : 'border-brand-gray/30'}`}>
                              <span className={`absolute top-0 right-0 px-2.5 py-0.5 rounded-bl font-mono text-[9px] font-bold ${isWon ? 'bg-green-500/10 text-green-400' : 'bg-brand-gray/20 text-brand-light/50'}`}>
                                {bet.status}
                              </span>

                              <div className="flex justify-between items-center pr-16">
                                <span className="font-bold text-brand-light">{bet.side === BetSide.LEFT ? bet.matchInfo.homeTeam : bet.matchInfo.awayTeam}</span>
                                <span className="text-[10px] font-mono text-brand-light/50">Monto: ${bet.amount.toFixed(2)}</span>
                              </div>

                              <div className="text-[11px] text-brand-light/70 flex justify-between items-center">
                                <span>{bet.matchInfo.homeTeam} vs {bet.matchInfo.awayTeam}</span>
                                <span className={`font-mono font-semibold ${isWon ? 'text-green-400' : 'text-brand-light/40 line-through'}`}>
                                  Premio: ${bet.potentialPayout.toFixed(4)}
                                </span>
                              </div>

                              <p className="text-[9px] text-brand-light/40 font-mono">ID: {bet.id} • {bet.createdAt}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* TAB 3: BANK SIMULATOR (Mateo's Masterpiece) */}
                  {activeAccountTab === 'BANK' && (
                    <div className="space-y-4">
                      
                      {/* Linked account card */}
                      <div className="bg-gradient-to-br from-brand-gray/20 to-brand-gray/5 border border-white/5 rounded-2xl p-4 text-xs relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-brand-light/40 uppercase tracking-widest text-[9px]">Tarjeta de Pruebas AstroPay</span>
                          <span className="text-xs">💳</span>
                        </div>
                        <p className="font-mono font-bold text-base text-brand-light mt-1 mb-2 tracking-wider">
                          **** **** **** {currentUser.bankDetails?.accountNumber.slice(-4) || '1234'}
                        </p>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[8px] uppercase font-mono text-brand-light/40">Titular de Cuenta</p>
                            <p className="font-semibold">{currentUser.bankDetails?.holderName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] uppercase font-mono text-brand-light/40">Banco de Enlace</p>
                            <p className="font-mono text-brand-red font-semibold text-[10px]">{currentUser.bankDetails?.bankName}</p>
                          </div>
                        </div>
                      </div>

                      {/* Process loader overlay */}
                      {bankProcessing ? (
                        <div className="bg-brand-bg/90 border border-brand-red/20 rounded-2xl p-6 text-center space-y-3 flex flex-col items-center justify-center min-h-[160px]">
                          <div className="w-12 h-12 rounded-full border-4 border-brand-red border-t-transparent animate-spin"></div>
                          <p className="text-sm font-display font-bold text-brand-light uppercase tracking-wider animate-pulse">
                            {bankActionType === 'DEPOSIT' ? 'Consultando Fondos...' : 'Transfiriendo Fondos...'}
                          </p>
                          <p className="text-[10px] text-brand-light/50 font-mono max-w-xs">
                            Estableciendo túnel simulado cifrado con {currentUser.bankDetails?.bankName} (Mateo Simulated Bank Gateway).
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          
                          {/* DEPOSIT FORM */}
                          <div className="bg-brand-gray/10 p-3 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center gap-1.5 mb-1 text-green-400">
                              <ArrowDownLeft className="w-4 h-4" />
                              <span className="text-[11px] font-mono font-bold uppercase">Depositar</span>
                            </div>
                            
                            <div>
                              <label className="block text-[9px] font-mono text-brand-light/50 uppercase mb-0.5">Monto ($)</label>
                              <input
                                type="number"
                                min="1"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-gray rounded p-1.5 text-xs font-mono text-brand-light"
                              />
                            </div>

                            <button
                              id="deposit-btn"
                              onClick={() => handleBankAction('DEPOSIT')}
                              className="w-full bg-green-500 hover:bg-green-600 text-white text-[10px] py-1.5 rounded font-bold transition-all cursor-pointer"
                            >
                              Cargar Saldo
                            </button>
                          </div>

                          {/* WITHDRAW FORM */}
                          <div className="bg-brand-gray/10 p-3 rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center gap-1.5 mb-1 text-brand-red">
                              <ArrowUpRight className="w-4 h-4" />
                              <span className="text-[11px] font-mono font-bold uppercase">Retirar</span>
                            </div>

                            <div>
                              <label className="block text-[9px] font-mono text-brand-light/50 uppercase mb-0.5">Monto ($)</label>
                              <input
                                type="number"
                                min="1"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full bg-brand-bg border border-brand-gray rounded p-1.5 text-xs font-mono text-brand-light"
                              />
                            </div>

                            <button
                              id="withdraw-btn"
                              onClick={() => handleBankAction('WITHDRAWAL')}
                              className="w-full bg-brand-red hover:bg-brand-dark-red text-white text-[10px] py-1.5 rounded font-bold transition-all cursor-pointer"
                            >
                              Retirar a Banco
                            </button>
                          </div>

                        </div>
                      )}

                      {bankMessage && (
                        <div className="bg-brand-red/10 border border-brand-red/20 text-brand-light text-center p-2 rounded-xl text-xs font-mono">
                          {bankMessage}
                        </div>
                      )}

                    </div>
                  )}

                  {/* TAB 4: TRANSACTION EXTRAC */}
                  {activeAccountTab === 'TRANSACTIONS' && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {transactions.length === 0 ? (
                        <div className="text-center py-6 text-brand-light/40 text-xs">
                          No se han registrado movimientos bancarios para esta cuenta en Firebase.
                        </div>
                      ) : (
                        transactions.map(tx => {
                          const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'WIN_PAYOUT';
                          return (
                            <div key={tx.id} className="bg-brand-gray/10 border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2 shrink-0">
                                {isDeposit ? (
                                  <span className="bg-green-500/10 text-green-400 p-1.5 rounded-lg font-mono">＋</span>
                                ) : (
                                  <span className="bg-brand-red/10 text-brand-red p-1.5 rounded-lg font-mono">－</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-brand-light truncate text-[11px]">{tx.description}</p>
                                <p className="text-[9px] text-brand-light/40 font-mono">{tx.createdAt}</p>
                              </div>
                              <div className="text-right font-mono font-bold text-[11px] shrink-0">
                                <span className={isDeposit ? 'text-green-400' : 'text-brand-red'}>
                                  {isDeposit ? '+' : '-'}${tx.amount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                </div>

              </div>

              {/* ================= SECTION C: SYSTEM RESULT SIMULATOR (ADMIN PANEL) ================= */}
              {currentUser.role === Role.ADMINISTRADOR && (
              <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-4">
                
                <div className="flex items-center gap-2 border-b border-brand-gray/20 pb-3">
                  <Settings className="w-5 h-5 text-brand-red" />
                  <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-brand-light">Panel de Administración (Firestore)</h3>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 gap-4 mb-2">
                  <button
                    onClick={() => setAdminTab('SIMULATE')}
                    className={`pb-2 font-display text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                      adminTab === 'SIMULATE'
                        ? 'border-brand-red text-brand-light'
                        : 'border-transparent text-brand-light/40 hover:text-brand-light/65'
                    }`}
                  >
                    🎬 Simular Partido
                  </button>
                  <button
                    onClick={() => setAdminTab('CREATE')}
                    className={`pb-2 font-display text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                      adminTab === 'CREATE'
                        ? 'border-brand-red text-brand-light'
                        : 'border-transparent text-brand-light/40 hover:text-brand-light/65'
                    }`}
                  >
                    ➕ Crear Partido
                  </button>
                </div>

                {adminTab === 'SIMULATE' ? (
                  <>
                    <p className="text-[11px] text-brand-light/60">
                      Usa esta consola para declarar el final de un partido y ver cómo Firestore calcula los pagos de cuotas y actualiza el saldo del usuario inmediatamente.
                    </p>

                    <form onSubmit={handleSimulateMatchEnd} className="space-y-3 text-xs">
                      
                      {/* Select Match */}
                      <div>
                        <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Selecciona Partido a Terminar</label>
                        <select
                          value={adminSelectedMatchId}
                          onChange={(e) => setAdminSelectedMatchId(e.target.value)}
                          className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2.5 focus:outline-none focus:border-brand-red text-brand-light"
                        >
                          <option value="">-- Elige Partido Activo --</option>
                          {matches.filter(m => m.status === MatchStatus.UPCOMING).map(m => (
                            <option key={m.id} value={m.id}>
                              {m.homeTeam} vs {m.awayTeam} (cuota: 1:{m.oddsRatio})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Settings columns */}
                      <div className="grid grid-cols-2 gap-3">
                        
                        {/* Winner selection */}
                        <div>
                          <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Ganador de Cuotas</label>
                          <select
                            value={adminWinner}
                            onChange={(e) => setAdminWinner(e.target.value as BetSide)}
                            className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2.5 focus:outline-none focus:border-brand-red text-brand-light"
                          >
                            <option value={BetSide.LEFT}>Lado Izquierdo (Local)</option>
                            <option value={BetSide.RIGHT}>Lado Derecho (Visitante)</option>
                          </select>
                        </div>

                        {/* Simulate scores */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono text-brand-light/50 uppercase mb-1">Goles Local</label>
                            <input
                              type="number"
                              min="0"
                              value={adminHomeScore}
                              onChange={(e) => setAdminHomeScore(parseInt(e.target.value) || 0)}
                              className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2 text-center text-brand-light"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono text-brand-light/50 uppercase mb-1">Goles Vis.</label>
                            <input
                              type="number"
                              min="0"
                              value={adminAwayScore}
                              onChange={(e) => setAdminAwayScore(parseInt(e.target.value) || 0)}
                              className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2 text-center text-brand-light"
                            />
                          </div>
                        </div>

                      </div>

                      {adminMessage && (
                        <div className="bg-brand-red/5 border border-brand-red/10 p-2.5 rounded-xl text-center font-mono text-[11px] text-brand-light/80">
                          {adminMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-brand-red to-brand-dark-red hover:opacity-95 text-brand-light py-2.5 rounded-xl font-display font-semibold transition-all duration-200 cursor-pointer text-center"
                      >
                        Simular Final de Partido 🎬
                      </button>

                    </form>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-brand-light/60">
                      Crea un nuevo partido con cuotas personalizadas y guárdalo directamente en Firestore para que esté disponible para apostar al instante.
                    </p>

                    <form onSubmit={handleCreateMatch} className="space-y-3 text-xs">
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Equipo Local</label>
                          <input
                            type="text"
                            value={adminHomeTeam}
                            onChange={(e) => setAdminHomeTeam(e.target.value)}
                            placeholder="Ej. Real Madrid"
                            className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2 focus:outline-none focus:border-brand-red text-brand-light"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Equipo Visitante</label>
                          <input
                            type="text"
                            value={adminAwayTeam}
                            onChange={(e) => setAdminAwayTeam(e.target.value)}
                            placeholder="Ej. Barcelona"
                            className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2 focus:outline-none focus:border-brand-red text-brand-light"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Bandera Local</label>
                          <input
                            type="text"
                            value={adminHomeFlag}
                            onChange={(e) => setAdminHomeFlag(e.target.value)}
                            placeholder="Ej. 🇪🇸"
                            className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2 focus:outline-none focus:border-brand-red text-brand-light"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Bandera Visitante</label>
                          <input
                            type="text"
                            value={adminAwayFlag}
                            onChange={(e) => setAdminAwayFlag(e.target.value)}
                            placeholder="Ej. 🇪🇸"
                            className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2 focus:outline-none focus:border-brand-red text-brand-light"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Ratio Cuota (1:N)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="1.0"
                            value={adminOddsRatio}
                            onChange={(e) => setAdminOddsRatio(parseFloat(e.target.value) || 2.0)}
                            className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2 focus:outline-none focus:border-brand-red text-brand-light"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-brand-light/60 uppercase mb-1">Fecha / Hora / Estado</label>
                          <input
                            type="text"
                            value={adminStartTime}
                            onChange={(e) => setAdminStartTime(e.target.value)}
                            placeholder="Ej. Hoy, 21:00"
                            className="w-full bg-brand-bg border border-brand-gray rounded-xl p-2 focus:outline-none focus:border-brand-red text-brand-light"
                            required
                          />
                        </div>
                      </div>

                      {adminCreateError && (
                        <div className="bg-brand-red/5 border border-brand-red/10 p-2.5 rounded-xl text-center font-mono text-[11px] text-brand-red">
                          {adminCreateError}
                        </div>
                      )}

                      {adminCreateMessage && (
                        <div className="bg-green-500/5 border border-green-500/10 p-2.5 rounded-xl text-center font-mono text-[11px] text-green-400">
                          {adminCreateMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-brand-red to-brand-dark-red hover:opacity-95 text-brand-light py-2.5 rounded-xl font-display font-semibold transition-all duration-200 cursor-pointer text-center"
                      >
                        Crear Partido ⚽
                      </button>

                    </form>
                  </>
                )}

              </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* FLOAT JUNIOR BITACORA WIDGET */}
      <JuniorDevNotes />

    </div>
  );
}
