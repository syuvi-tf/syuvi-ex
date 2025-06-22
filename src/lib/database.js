const Database = require('better-sqlite3');
const db = new Database('jump.db'
  //  , { verbose: console.log }
);
// const { createStartJob, createEndJob } = require('./schedules.js');

// open connection
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

// insert a new player, if they don't exist, and returns them
function createPlayer(discord_id, display_name) {
  const insert = db.prepare(`INSERT OR IGNORE INTO player (discord_id, display_name)
        VALUES (?, ?)`);
  insert.run(discord_id, display_name);
  return getPlayer(discord_id);
}

// return a player
function getPlayer(discord_id) {
  const select = db.prepare(`SELECT * FROM player
    WHERE discord_id = ?`);
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
  const player = getPlayer(discord_id);
  // will not update if a player isn't signed up, so this is okay
  if (trny && player && division.class === trny.class) {
    updateTourneyPlayerDivision(trny.id, player.id, division.name);
  }
}

// sets player divisions from their division role(s)
// only creates a player if they have a division role
function updateAllPlayerDivisions(members) {
  let numUpdates = 0;
  const trny = getActiveTourney();
  const update = db.prepare(`UPDATE player
      SET soldier_division = :soldier_division,
          demo_division = :demo_division
      WHERE discord_id = :discord_id`);
  const updateEach = db.transaction((players) => {
    for (const partialPlayer of players) {
      update.run(partialPlayer);
      const player = getPlayer(partialPlayer.discord_id);
      if (trny && player) {
        if (trny.class === 'Soldier') {
          updateTourneyPlayerDivision(trny.id, player.id, player.soldier_division);
        }
        else { // demo tourney
          updateTourneyPlayerDivision(trny.id, player.id, player.demo_division);
        }
      }
    }
  });

  const partialPlayers = new Set();
  members.forEach((member) => {
    const soldierRole = member.roles.cache.find((role) => role.name.includes('Soldier'));
    const soldierDivision = !soldierRole ? null : soldierRole.name.substring(0, soldierRole.name.indexOf(' '));
    const demoRole = member.roles.cache.find((role) => role.name.includes('Demo'));
    const demoDivision = !demoRole ? null : demoRole.name.substring(0, demoRole.name.indexOf(' '));
    // if a member has a division role, try inserting them into the database
    if (demoDivision || soldierDivision) {
      createPlayer(member.id, member.displayName);
    }
    // set the divisions to update
    partialPlayers.add({
      soldier_division: soldierDivision,
      demo_division: demoDivision,
      discord_id: member.id,
    });
    if (soldierDivision) { numUpdates++; }
    if (demoDivision) { numUpdates++; }
  });
  updateEach(partialPlayers);
  return numUpdates;
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
  const activeTrny = getActiveTourney();
  if (!activeTrny) {
    const insert = db.prepare(`INSERT OR IGNORE INTO tournament (class, plat_gold_map, silver_map, bronze_map, steel_map, wood_map, starts_at, ends_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    insert.run(trny.class, trny.plat_gold, trny.silver, trny.bronze, trny.steel, trny.wood, trny.starts_at, trny.ends_at);
    return true;
  }
  // already an active tourney
  return false;
}

// return nearest tourney in the future
function getActiveTourney() {
  const select = db.prepare(`SELECT * FROM tournament
    WHERE ends_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`);
  return select.get();
}

// return most recent tourney
function getRecentTourney() {
  const select = db.prepare(`SELECT * FROM tournament
    ORDER BY starts_at DESC`);
  return select.get();
}

// return all tourneys
function getAllTourneys() {
  const select = db.prepare(`SELECT * FROM tournament`);
  return select.all();
}

// insert new player in a tourney, update them otherwise
function createTourneyPlayer(tournament_id, player_id, division_name) {
  const upsert = db.prepare(`INSERT INTO tournament_player (tournament_id, player_id, division, signed_up)
    VALUES (?, ?, ?, TRUE)
    ON CONFLICT (tournament_id, player_id) DO UPDATE
    SET signed_up = TRUE`);
  upsert.run(tournament_id, player_id, division_name);
}

// set signed_up to false, removing a player from the tourney
function removeTourneyPlayer(tournament_id, player_id) {
  const update = db.prepare(`UPDATE tournament_player
    SET signed_up = FALSE
    WHERE tournament_id = ? AND player_id = ?`);
  update.run(tournament_id, player_id);
}

function getTourneyPlayer(tournament_id, player_id) {
  const select = db.prepare(`SELECT * FROM tournament_player
    WHERE tournament_id = ? AND player_id = ? AND signed_up = TRUE`);
  return select.get(tournament_id, player_id);
}

// return all tourney players and associated discord ids
function getTourneyPlayers(tournament_id) {
  const select = db.prepare(`SELECT tournament_player.*, player.discord_id FROM tournament_player
    JOIN player ON player_id = id
    WHERE tournament_id = ? AND signed_up = TRUE`);
  return select.all(tournament_id);
}

// update the division of a tourney player
function updateTourneyPlayerDivision(tournament_id, player_id, division_name) {
  const update = db.prepare(`UPDATE tournament_player
    SET division = ?
    WHERE tournament_id = ? AND player_id = ?`);
  update.run(division_name, tournament_id, player_id);
}

// create a tourney time
function createTourneyTime(tournament_id, player_id, run_time, verified) {
  const insert = db.prepare(`INSERT OR IGNORE INTO tournament_time (tournament_id, player_id, run_time, verified)
        VALUES (?, ?, ?, ?)`);
  const info = insert.run(tournament_id, player_id, run_time, verified ? '1' : '0');
  if (info.changes === 1) {
    return info.lastInsertRowid;
  }
  return -1;
}

// return a player's tourney times
function getTourneyTimes(tournament_id, discord_id) {
  const trny_id = tournament_id ?? getActiveTourney()?.id ?? getRecentTourney()?.id;
  const select = db.prepare(`SELECT * FROM tournament_time
    WHERE tournament_id = ? AND player_id = ?
    ORDER BY run_time`);
  return select.all(trny_id, discord_id);
}

// return every player's best tourney time
function getBestTourneyTimes(tournament_id) {
  const select = db.prepare(`SELECT tournament_time.tournament_id, tournament_time.player_id, min(run_time) AS run_time, tournament_time.verified, player.display_name, tournament_player.division FROM tournament_time
    JOIN player ON tournament_time.player_id = player.id
    JOIN tournament_player ON tournament_time.player_id = tournament_player.player_id
    WHERE tournament_time.tournament_id = ?
    GROUP BY player.id`);
  return select.all(tournament_id);
}

// verify a time for current or most recent tourney
function verifyTourneyTime(discord_id, time_id) {
  const player = getPlayer(discord_id);
  const trny = getActiveTourney() ?? getRecentTourney();
  const update = db.prepare(`UPDATE tournament_time
    SET verified = TRUE
    WHERE tournament_time.id = ? AND tournament_id = ? AND player_id = ?`);
  if (trny && player) {
    update.run(time_id, trny.id, player.id);
    return true;
  }
  // no trny or player
  return false;
}
// close connection
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
  getRecentTourney,
  getAllTourneys,
  createTourneyPlayer,
  removeTourneyPlayer,
  getTourneyPlayer,
  getTourneyPlayers,
  createTourneyTime,
  getTourneyTimes,
  getBestTourneyTimes,
  verifyTourneyTime,
  closeDB,
};