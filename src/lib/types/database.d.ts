type SoldierDivision = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Steel' | 'Wood';
type DemoDivision = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Steel' | 'Wood';

// Competition Phases
// ready     - marathon has yet to be announced
// upcoming  - competition is announced, and current Date < starts_at
// live      - competition is ongoing, and starts_at < current Date < ends_at
// completed - competition has finished, and ends_at < current Date
// cancelled - competition was canceled, when current Date was < starts_at
type CompetitionPhase = 'upcoming' | 'live' | 'completed' | 'canceled';
type MarathonPhase = 'ready' | CompetitionPhase;

type CompetitionType = 'marathon' | 'minithon' | 'bounty' | 'motw';
type Competition = Marathon | Minithon | Bounty | MOTW;
type Marathon = MarathonPartial & CompetitionPartial;
type Minithon = MinithonPartial & CompetitionPartial;
type Bounty = BountyPartial & CompetitionPartial;
type MOTW = MOTWPartial & CompetitionPartial;

interface Player {
  id: number;
  discord_id: string;
  steam_id: string | null;
  steam_trade_token: string | null;
  tempus_id: string | null;
  display_name: string;
  soldier_division: SoldierDivision | null;
  demo_division: DemoDivision | null;
  created_at: Date;
}

interface CompetitionPartial {
  id: number;
  class: 'Soldier' | 'Demo';
  starts_at: Date;
  ends_at: Date;
  created_at: Date;
}

// join with competitions to define their division name(s) / map(s)
interface CompetitionDivision {
  id: number;
  competition_id: number;
  division: SoldierDivision | DemoDivision;
  placements: number;
  map: string;
}

interface MarathonPartial {
  id: number;
  competition_id: number;
  signup_message_id: string | null;
  phase: MarathonPhase;
}

interface MinithonPartial {
  id: number;
  competition_id: number;
  phase: CompetitionPhase;
}

interface BountyPartial {
  id: number;
  competition_id: number;
  phase: CompetitionPhase;
  bounty_type: 'Time' | 'Completion';
}

// Map of the Week's map applies to all divisions
interface MOTWPartial {
  id: number;
  competition_id: number;
  phase: CompetitionPhase;
  map: string;
}

// division should only be updated if a competition is upcoming | live
interface CompetitionPlayer {
  competition_id: number;
  player_id: number;
  signed_up: boolean;
  division: SoldierDivision | DemoDivision | null;
  created_at: Date;
}

interface PlayerTime {
  id: number;
  competition_id: number;
  player_id: number;
  run_time: number;
  verified: boolean;
  created_at: Date;
}
