import { Match, MatchStatus } from '../types';

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeFlag: '🇪🇸',
    awayFlag: '🇪🇸',
    oddsRatio: 1.8,
    status: MatchStatus.UPCOMING,
    startTime: 'Hoy, 21:00'
  },
  {
    id: 'm2',
    homeTeam: 'Manchester City',
    awayTeam: 'Liverpool',
    homeFlag: '🇬🇧',
    awayFlag: '🇬🇧',
    oddsRatio: 2.5,
    status: MatchStatus.UPCOMING,
    startTime: 'Hoy, 18:30'
  },
  {
    id: 'm3',
    homeTeam: 'PSG',
    awayTeam: 'Marseille',
    homeFlag: '🇫🇷',
    awayFlag: '🇫🇷',
    oddsRatio: 3.2,
    status: MatchStatus.UPCOMING,
    startTime: 'Mañana, 20:00'
  },
  {
    id: 'm4',
    homeTeam: 'Astro FC',
    awayTeam: 'Saturn United',
    homeFlag: '🚀',
    awayFlag: '🪐',
    oddsRatio: 1000,
    status: MatchStatus.UPCOMING,
    startTime: 'En vivo - Min 45'
  },
  {
    id: 'm5',
    homeTeam: 'Boca Juniors',
    awayTeam: 'River Plate',
    homeFlag: '🇦🇷',
    awayFlag: '🇦🇷',
    oddsRatio: 2.1,
    status: MatchStatus.UPCOMING,
    startTime: 'Hoy, 23:30'
  },
  {
    id: 'm6',
    homeTeam: 'Selección España',
    awayTeam: 'Andorra FC',
    homeFlag: '🇪🇸',
    awayFlag: '🇦🇩',
    oddsRatio: 12.0,
    status: MatchStatus.UPCOMING,
    startTime: 'Mañana, 15:00'
  }
];
