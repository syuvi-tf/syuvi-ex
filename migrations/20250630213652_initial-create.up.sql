-- N.B. we use `IF NOT EXISTS` because this migration was created after the production database was created, but
-- this migration represents the initial state of the production database.

-- All players tracked by syuvi.
CREATE TABLE IF NOT EXISTS player (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    soldier_division TEXT,
    demo_division TEXT,
    tempus_id INTEGER,
    steam_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tournaments created by syuvi admins.
CREATE TABLE IF NOT EXISTS tournament (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    class TEXT NOT NULL,
    plat_gold_map TEXT NOT NULL,
    silver_map TEXT NOT NULL,
    bronze_map TEXT NOT NULL,
    steel_map TEXT NOT NULL,
    wood_map TEXT,
    starts_at DATETIME NOT NULL,
    ends_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- player-tournament many-to-many relationship. Also includes state such as what division the
-- player is in, and whether or not the player is still signed up for the related tournament.
CREATE TABLE IF NOT EXISTS tournament_player (
    tournament_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    division TEXT,
    signed_up BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tournament_id, player_id),
    FOREIGN KEY (tournament_id) REFERENCES tournament (id),
    FOREIGN KEY (player_id) REFERENCES player (id)
);

-- run times submitted by players for a particular tournament.
CREATE TABLE IF NOT EXISTS tournament_time (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    run_time FLOAT NOT NULL,
    verified BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournament (id),
    FOREIGN KEY (player_id) REFERENCES player (id)
);
