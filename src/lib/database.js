const Database = require('better-sqlite3');
const db = new Database('jump.db'
  //  , { verbose: console.log }
);
// const { createStartJob, createEndJob } = require('./schedules.js');

// open connection to db
function openDB() {
  db.prepare(`CREATE TABLE IF NOT EXISTS player (
    id               INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    discord_id       TEXT NOT NULL UNIQUE,
    display_name     TEXT NOT NULL,
    soldier_division TEXT,
    demo_division    TEXT,
    tempus_id        INTEGER,
    steam_id         TEXT,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS tournament (
    id              INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    class           TEXT NOT NULL,
    plat_gold_map   TEXT NOT NULL,
    silver_map      TEXT NOT NULL,
    bronze_map      TEXT NOT NULL,
    steel_map       TEXT NOT NULL,
    wood_map        TEXT,
    starts_at       DATETIME NOT NULL,
    ends_at         DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS tournament_player (
    tournament_id INTEGER NOT NULL,
    player_id     INTEGER NOT NULL,
    division      TEXT,
    signed_up     BOOLEAN NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tournament_id, player_id),
    FOREIGN KEY (tournament_id) REFERENCES tournament (id),
    FOREIGN KEY (player_id) REFERENCES player (id))`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS tournament_time (
    id            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    player_id     INTEGER NOT NULL,
    run_time      FLOAT NOT NULL,
    verified      BOOLEAN NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournament (id),
    FOREIGN KEY (player_id) REFERENCES player (id))`).run();
}

// inserts a new player in the db, if they don't exist
function createPlayer(discord_id, display_name) {
  const insert = db.prepare(`INSERT OR IGNORE INTO player (discord_id, display_name)
        VALUES (?, ?)`);
  insert.run(discord_id, display_name);
}

// get a player, creates a player if they don't exist
function getPlayer(discord_id) {
  const select = db.prepare(`SELECT * FROM player
    WHERE discord_id = ?`);
  const player = select.get(discord_id);
  if (player === undefined) createPlayer();
  return select.get(discord_id);
}

// update a player's display name
function updatePlayerDisplayName(discord_id, display_name) {
  const update = db.prepare(`UPDATE player
    SET display_name = ?
    WHERE discord_id = ?`);
  update.run(display_name, discord_id);
}

// update a player's division
function updatePlayerDivision(discord_id, division) {
  const update = db.prepare(`UPDATE player
    SET ${division.class === 'Soldier' ? 'soldier_division' : 'demo_division'} = ?
    WHERE discord_id = ?`);
  update.run(division.name, discord_id);

  const trny = getActiveTourney();
  if (trny !== undefined && getPlayer(discord_id) !== undefined) {
    updateTourneyPlayerDivision(trny.id, getPlayer(discord_id).id, division.name);
  }
}

// sets all player divisions from their discord role(s)
function updateAllPlayerDivisions(members) {
  const trny = getActiveTourney();
  const update = db.prepare(`UPDATE player
      SET soldier_division = :soldier_division,
          demo_division = :demo_division
      WHERE discord_id = :discord_id`);
  const updateEach = db.transaction((players) => {
    for (const player of players) {
      update.run(player);
      if (trny !== undefined && getPlayer(player.discord_id) !== undefined) {
        updateTourneyPlayerDivision(trny.id, getPlayer(player.discord_id).id, trny.class === 'Soldier' ? player.soldier_division : player.demo_division);
      }
    }
  });

  const playersToUpdate = new Set();
  members.forEach((member) => {
    const soldierRole = member.roles.cache.find((role) => role.name.includes('Soldier'));
    const soldierDivision = soldierRole === undefined ? null : soldierRole.name.substring(0, soldierRole.name.indexOf(' '));
    const demoRole = member.roles.cache.find((role) => role.name.includes('Demo'));
    const demoDivision = demoRole === undefined ? null : demoRole.name.substring(0, demoRole.name.indexOf(' '));
    // if a member has a division role, try inserting them into the database
    if (demoDivision !== null || soldierDivision !== null) {
      createPlayer(member.id, member.displayName);
    }
    playersToUpdate.add({
      soldier_division: soldierDivision,
      demo_division: demoDivision,
      discord_id: member.id
    });
  });
  updateEach(playersToUpdate);
}

// steam URL formatting
// const W = parseInt(steam_id32.substring(steam_id32.lastIndexOf(':') + 1)) * 2 + 1;
// const steam_url = `https://steamcommunity.com/profiles/[U:1:${W}]`;
// update a player's tempus and steam ids
function updatePlayerIds(discord_id, tempus_id, steam_id) {
  const update = db.prepare(`UPDATE player
    SET tempus_id = ?,
        steam_id = ?
    WHERE discord_id = ?`);
  update.run(tempus_id, steam_id, discord_id);
}

// only create a tourney if none are upcoming / active
function createTourney(trny) {
  const select = db.prepare(`SELECT * FROM tournament
    WHERE ends_at > datetime('now')
    ORDER BY starts_at ASC`);
  const activeTrny = select.get();
  if (!activeTrny) {
    const insert = db.prepare(`INSERT OR IGNORE INTO tournament (class, plat_gold_map, silver_map, bronze_map, steel_map, wood_map, starts_at, ends_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    insert.run(trny.class, trny.plat_gold, trny.silver, trny.bronze, trny.steel, trny.wood, trny.starts_at, trny.ends_at);
    return true;
  }
  return false;
}

// returns the nearest tourney in the future, and undefined otherwise 
function getActiveTourney() {
  const select = db.prepare(`SELECT * FROM tournament
    WHERE ends_at > datetime('now')
    ORDER BY starts_at ASC`);
  return select.get();
}

// insert a new player in the tourney, update them otherwise
function createTourneyPlayer(tournament_id, player_id, division) {
  const upsert = db.prepare(`INSERT INTO tournament_player (tournament_id, player_id, division, signed_up)
    VALUES (?, ?, ?, TRUE)
    ON CONFLICT (tournament_id, player_id) DO UPDATE
    SET signed_up = TRUE`);
  upsert.run(tournament_id, player_id, division);
}

// set signed_up to false, removing a player from the tourney
function removeTourneyPlayer(tournament_id, player_id) {
  const update = db.prepare(`UPDATE tournament_player
    SET signed_up = FALSE
    WHERE tournament_id = ? AND player_id = ?`);
  update.run(tournament_id, player_id);
}

// get all tourney players and associated discord ids
function getTourneyPlayers(tournament_id) {
  const select = db.prepare(`SELECT tournament_player.*, player.discord_id FROM tournament_player
    JOIN player ON player_id = id
    WHERE tournament_id = ? AND signed_up = TRUE`);
  return select.all(tournament_id);
}

// update the division of a tourney player
function updateTourneyPlayerDivision(tournament_id, player_id, division) {
  const update = db.prepare(`UPDATE tournament_player
    SET division = ?
    WHERE tournament_id = ? AND player_id = ?`);
  update.run(division, tournament_id, player_id);
}

function createTourneyTime(tournament_id, player_id, run_time, verified) {
  const insert = db.prepare(`INSERT OR IGNORE INTO tournament_time (tournament_id, player_id, run_time, verified)
        VALUES (?, ?, ?, ?)`);
  insert.run(tournament_id, player_id, run_time, verified ? '1' : '0');
}

function getBestTourneyTimes(tournament_id) {
  const select = db.prepare(`SELECT tournament_time.tournament_id, tournament_time.player_id, min(run_time) AS run_time, tournament_time.verified, player.display_name, tournament_player.division FROM tournament_time
    JOIN player ON tournament_time.player_id = player.id
    JOIN tournament_player ON tournament_time.player_id = tournament_player.player_id
    WHERE tournament_time.tournament_id = ?`);
  return select.all(tournament_id);
}

function verifyTourneyTimes(tournament_id, discord_id) {
  const player = getPlayer(discord_id);
  const update = db.prepare(`UPDATE tournament_time
    SET verified = TRUE,
    WHERE tournament_id = ? AND player_id = ?`);
  update.run(tournament_id, player.id);
}
// close connection to db
function closeDB() {
  db.close();
}

module.exports = {
  openDB,
  createPlayer,
  getPlayer,
  updatePlayerDisplayName,
  updatePlayerDivision,
  updateAllPlayerDivisions,
  updatePlayerIds,
  createTourney,
  getActiveTourney,
  createTourneyPlayer,
  removeTourneyPlayer,
  getTourneyPlayers,
  createTourneyTime,
  getBestTourneyTimes,
  verifyTourneyTimes,
  closeDB,
};