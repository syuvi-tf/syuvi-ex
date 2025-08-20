type SoldierDivision = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Steel' | 'Wood';
type DemoDivision = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Steel' | 'Wood';

// Competition Phases
// ready     - marathon has yet to be announced
// upcoming  - competition is announced, and current Date < starts_at
// live      - competition is ongoing, and starts_at < current Date < ends_at
// completed - competition has finished, and ends_at < current Date
// cancelled - competition was cancelled, when current Date was < starts_at
type CompetitionPhase = 'live' | 'completed';
type MarathonPhase = 'ready' | 'upcoming' | 'cancelled' | CompetitionPhase;
type MinithonPhase = 'upcoming' | 'cancelled' | CompetitionPhase;
type BountyPhase = 'upcoming' | 'cancelled' | CompetitionPhase;
type MOTWPhase = CompetitionPhase;

interface Competition {
  id: number;
}

interface Player {
  id: number;
  discord_id: string;
  steam_id: string | null;
  tempus_id: string | null;
  display_name: string;
  soldier_division: SoldierDivision | null;
  demo_division: DemoDivision | null;
  created_at: Date;
}

interface Marathon {
  id: number;
  competition_id: number;
  signup_message_id: string | null;
  phase: MarathonPhase;
  class: 'Soldier' | 'Demo';
  plat_map: string;
  gold_map: string;
  silver_map: string;
  bronze_map: string;
  steel_map: string;
  wood_map: string;
  starts_at: Date;
  ends_at: Date;
  created_at: Date;
}

interface Minithon {
  id: number;
  competition_id: number;
  phase: MinithonPhase;
  class: 'Soldier' | 'Demo';
  plat_map: string;
  gold_map: string;
  silver_map: string;
  bronze_map: string;
  steel_map: string;
  wood_map: string;
  starts_at: Date;
  ends_at: Date;
  created_at: Date;
}

interface Bounty {
  id: number;
  competition_id: number;
  phase: BountyPhase;
  bounty_type: 'Time' | 'Completion';
  class: 'Soldier' | 'Demo';
  division: SoldierDivision | DemoDivision;
  map: string;
  starts_at: Date;
  ends_at: Date;
  created_at: Date;
}

interface MOTW {
  id: number;
  competition_id: number;
  phase: MOTWPhase;
  class: string;
  map: string;
  ends_at: Date;
  created_at: Date;
}

interface MarathonPlayer {
  marathon_id: number;
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
