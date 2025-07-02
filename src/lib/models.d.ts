export type DateTimeString = string!;
export type Snowflake = string!;

export interface Player {
    id: string;
    discord_id: string;
    display_name: string;
    soldier_division: string?;
    demo_division: string?;
    tempus_id: string?;
    steam_id: string?;
    created_at: DateTimeString;
}

export interface Tournament {
    id: string;
    class: string;
    plat_gold_map: string;
    silver_map: string;
    bronze_map: string;
    steel_map: string;
    wood_map: string?;
    start_at: DateTimeString;
    ends_at: DateTimeString;
    created_at: DateTimeString;
}

export interface TournamentPlayer {
    tournament_id: string;
    player_id: string;
    division: string?;
    signed_up: boolean;
    created_at: DateTimeString;
}

export interface TournamentTime {
    id: string;
    tournament_id: string;
    player_id: string;
    run_time: number;
    verified: boolean;
    created_at: DateTimeString;
}

export interface TournamentSignupMessage {
    id: string;
    tournament_id: string;
    discord_id: Snowflake;
    created_at: DateTimeString;
}
