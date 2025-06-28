const Database = require('better-sqlite3');
const dbPath = process.env.FLY_APP_NAME ? "/litefs/db" : "jump.db";
const db = new Database(dbPath
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

// return a player
function getPlayerByID(player_id) {
  const select = db.prepare(`SELECT * FROM player
    WHERE id = ?`);
  return select.get(player_id);
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
    const soldierRole = member.roles.cache.find((role) => role.name.endsWith(' Soldier'));
    const soldierDivision = !soldierRole ? null : soldierRole.name.substring(0, soldierRole.name.indexOf(' '));
    const demoRole = member.roles.cache.find((role) => role.name.endsWith(' Demo'));
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

// set Tempus and SteamID32
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

// get tourney by id
function getTourney(tournament_id) {
  const select = db.prepare(`SELECT * FROM tournament
    WHERE id = ?`);
  return select.get(tournament_id);
}

// return nearest tourney in the future
function getActiveTourney() {
  const select = db.prepare(`SELECT * FROM tournament
    WHERE ends_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`);
  return select.get();
}

function getOngoingTourney() {
  const select = db.prepare(`SELECT * FROM tournament
    WHERE ends_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    AND starts_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`);
  return select.get();
}

// return most recent tourney
function getRecentTourney() {
  const select = db.prepare(`SELECT * FROM tournament
    WHERE ends_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
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

// return a time
function getTime(time_id) {
  const select = db.prepare(`SELECT * FROM tournament_time
    WHERE id = ?`);
  return select.get(time_id);
}

// return a player's best tourney time
function getPlayerBestTourneyTime(tournament_id, player_id) {
  const select = db.prepare(`SELECT * FROM tournament_time
    WHERE tournament_id = ? AND player_id = ?
    ORDER BY run_time`);
  return select.get(tournament_id, player_id);
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

function getTourneyDivisionTopTimes(tournament_id, division_name) {
  const select = db.prepare(`SELECT tournament_time.tournament_id, tournament_time.player_id, min(run_time) AS run_time, tournament_time.verified, player.discord_id, tournament_player.division FROM tournament_time
    JOIN player ON tournament_time.player_id = player.id
    JOIN tournament_player ON tournament_time.player_id = tournament_player.player_id
    WHERE tournament_time.tournament_id = ? AND tournament_player.division = ?
    GROUP BY player.id
    LIMIT 8`);
  return select.all(tournament_id, division_name);
}

// verify a time
function verifyTourneyTime(time_id) {
  const update = db.prepare(`UPDATE tournament_time
    SET verified = TRUE
    WHERE id = ?`);
  update.run(time_id);
}

function removeTourneyTime(time_id) {
  const remove = db.prepare(`DELETE FROM tournament_time
  WHERE id = ?`);
  remove.run(time_id);
}

// close connection
function closeDB() {
  db.close();
}

// test functions
function forceStartTourney(tournament_id) {
  const update = db.prepare(`UPDATE tournament
    SET starts_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '+1 minute')
    WHERE id = ?`);
  update.run(tournament_id);
}

function forceEndTourney(tournament_id) {
  const update = db.prepare(`UPDATE tournament
    SET ends_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '+1 minute')
    WHERE id = ?`);
  update.run(tournament_id);
}

module.exports = {
  openDB,
  createPlayer,
  getPlayer,
  getPlayerByID,
  updatePlayerDisplayName,
  updatePlayerDivision,
  updateAllPlayerDivisions,
  updatePlayerIds,
  getTourney,
  createTourney,
  getOngoingTourney,
  getActiveTourney,
  getRecentTourney,
  getAllTourneys,
  createTourneyPlayer,
  removeTourneyPlayer,
  getTourneyPlayer,
  getTourneyPlayers,
  createTourneyTime,
  getTime,
  getTourneyDivisionTopTimes,
  getPlayerBestTourneyTime,
  getBestTourneyTimes,
  verifyTourneyTime,
  removeTourneyTime,
  closeDB,
  // test functions
  forceStartTourney,
  forceEndTourney
};