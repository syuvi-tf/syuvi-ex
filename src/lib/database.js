import Database from "better-sqlite3";

const dbPath = process.env.FLY_APP_NAME ? "/litefs/db" : "jump.db";
const db = new Database(dbPath);

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
    SET ${division.class === "Soldier" ? "soldier_division" : "demo_division"} = ?
    WHERE discord_id = ?`);
  update.run(division.name, discord_id);

  const tourney = getActiveTourney();
  const player = getPlayer(discord_id);
  // will not update if a player isn't signed up, so this is okay
  if (tourney && player && division.class === tourney.class) {
    updateTourneyPlayerDivision(tourney.id, player.id, division.name);
  }
}

// sets player divisions from their division role(s)
// only creates a player if they have a division role
function updateAllPlayerDivisions(members) {
  let numUpdates = 0;
  const tourney = getActiveTourney();
  const update = db.prepare(`UPDATE player
      SET soldier_division = :soldier_division,
          demo_division = :demo_division
      WHERE discord_id = :discord_id`);
  const updateEach = db.transaction((players) => {
    for (const partialPlayer of players) {
      update.run(partialPlayer);
      const player = getPlayer(partialPlayer.discord_id);
      if (tourney && player) {
        if (tourney.class === "Soldier") {
          updateTourneyPlayerDivision(tourney.id, player.id, player.soldier_division);
        } else {
          // demo tourney
          updateTourneyPlayerDivision(tourney.id, player.id, player.demo_division);
        }
      }
    }
  });

  const partialPlayers = new Set();
  members.forEach((member) => {
    const soldierRole = member.roles.cache.find((role) => role.name.endsWith(" Soldier"));
    const soldierDivision = !soldierRole
      ? null
      : soldierRole.name.substring(0, soldierRole.name.indexOf(" "));
    const demoRole = member.roles.cache.find((role) => role.name.endsWith(" Demo"));
    const demoDivision = !demoRole ? null : demoRole.name.substring(0, demoRole.name.indexOf(" "));
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
    if (soldierDivision) {
      numUpdates++;
    }
    if (demoDivision) {
      numUpdates++;
    }
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
function createTourney(tourney) {
  const activetourney = getActiveTourney();
  if (!activetourney) {
    const insert =
      db.prepare(`INSERT OR IGNORE INTO tournament (class, plat_gold_map, silver_map, bronze_map, steel_map, wood_map, starts_at, ends_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    insert.run(
      tourney.class,
      tourney.plat_gold,
      tourney.silver,
      tourney.bronze,
      tourney.steel,
      tourney.wood,
      tourney.starts_at,
      tourney.ends_at,
    );
    return true;
  }
  // already an active tourney
  return false;
}

function updateTourneyMap(tourney) {
  const update = db.prepare(`UPDATE tournament
    SET plat_gold_map = ?,
    silver_map = ?,
    bronze_map = ?,
    steel_map = ?,
    wood_map = ?
    WHERE id = ?`);
  update.run(
    tourney.plat_gold_map,
    tourney.silver_map,
    tourney.bronze_map,
    tourney.steel_map,
    tourney.wood_map,
    tourney.id,
  );
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
  const upsert =
    db.prepare(`INSERT INTO tournament_player (tournament_id, player_id, division, signed_up)
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
  const select =
    db.prepare(`SELECT tournament_player.*, player.discord_id, player.display_name FROM tournament_player
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
  const insert =
    db.prepare(`INSERT OR IGNORE INTO tournament_time (tournament_id, player_id, run_time, verified)
        VALUES (?, ?, ?, ?)`);
  const info = insert.run(tournament_id, player_id, run_time, verified ? "1" : "0");
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
  const select =
    db.prepare(`SELECT tournament_time.tournament_id, tournament_time.player_id, min(run_time) AS run_time, tournament_time.verified, player.display_name, tournament_player.division FROM tournament_time
    JOIN player ON tournament_time.player_id = player.id
    JOIN tournament_player ON tournament_time.player_id = tournament_player.player_id
    WHERE tournament_time.tournament_id = ?
    GROUP BY player.id`);
  return select.all(tournament_id);
}

function getTourneyDivisionTopTimes(tournament_id, division_name) {
  const select =
    db.prepare(`SELECT tournament_time.tournament_id, tournament_time.player_id, min(run_time) AS run_time, tournament_time.verified, player.discord_id, tournament_player.division FROM tournament_time
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

/**
 *
 * @param {string | number} tournamentId
 * @returns {any | undefined} undefined if there is no signup message associated with the tournament
 */
function getTourneySignupMessage(tournamentId) {
  const select = db.prepare(`SELECT discord_id
    FROM tournament_signup_message
    WHERE tournament_id = ?
    ORDER BY created_at DESC
    LIMIT 1`);

  return select.get(tournamentId);
}

/**
 *
 * @param {string | number} tournamentId
 * @param {string} discordMessageId
 * @throws if there is an error inserting, its usually because the message ID was already used
 */
function addTourneySignupMessage(tournamentId, discordMessageId) {
  const insert = db.prepare(
    `INSERT INTO tournament_signup_message (tournament_id, discord_id) values (?, ?)`,
  );

  insert.run(tournamentId, discordMessageId);
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

export {
  createPlayer,
  getPlayer,
  getPlayerByID,
  updatePlayerDisplayName,
  updatePlayerDivision,
  updateAllPlayerDivisions,
  updatePlayerIds,
  getTourney,
  createTourney,
  updateTourneyMap,
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
  getTourneySignupMessage,
  addTourneySignupMessage,
  closeDB,
  // test functions
  forceStartTourney,
  forceEndTourney,
};
