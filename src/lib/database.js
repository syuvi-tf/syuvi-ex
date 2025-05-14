const sqlite = require('sqlite3');
const db = new sqlite.Database('jump.db');

// open connection to sqlite3 db
function openDB() {
  // reset db for testing

  db.run(`DROP TABLE IF EXISTS player`);
  db.run(`DROP TABLE IF EXISTS tournament`);
  db.run(`DROP TABLE IF EXISTS tournament_player`);
  db.run(`DROP TABLE IF EXISTS tournament_time`);

  db.run(`CREATE TABLE IF NOT EXISTS player (
    id               INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    discord_id       TEXT NOT NULL UNIQUE,
    display_name     TEXT NOT NULL,
    soldier_division TEXT,
    demo_division    TEXT,
    tempus_id        TEXT,
    steam_url        TEXT,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);

  db.run(`CREATE TABLE IF NOT EXISTS tournament (
    id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    class      TEXT NOT NULL,
    starts_at  DATETIME NOT NULL,
    ends_at    DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);

  db.run(`CREATE TABLE IF NOT EXISTS tournament_player (
    tournament_id INTEGER NOT NULL,
    player_id     INTEGER NOT NULL,
    division      TEXT NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tournament_id, player_id),
    FOREIGN KEY (tournament_id) REFERENCES tournament (id),
    FOREIGN KEY (player_id) REFERENCES player (id))`);

  db.run(`CREATE TABLE IF NOT EXISTS tournament_time (
      id            INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      player_id     INTEGER NOT NULL,
      run_time      TIME NOT NULL,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournament (id),
      FOREIGN KEY (player_id) REFERENCES player (id))`);
}

// inserts a new player in the db, if they don't exist
function createPlayer(discord_id, display_name) {
  db.run(`INSERT OR IGNORE INTO player (discord_id, display_name)
        VALUES (?, ?)`,
    discord_id, display_name);
}

function setDisplayName(discord_id, display_name) {
  db.run(`UPDATE player
          SET display_name = ?
          WHERE discord_id = ?`,
    display_name, discord_id);
}

// sets divison of an existing player
function setDivision(discord_id, player_class, division) {
  db.run(`UPDATE player
    SET ${player_class === 'Soldier' ? 'soldier_division' : 'demo_division'} = ?
    WHERE discord_id = ?`,
    division, discord_id);
}

// sets all player divisions from their discord role(s)
function setDivisionsFromRoles(members) {
  members.forEach(member => {
    const soldier_role = member.roles.cache.find((role) => role.name.includes('Soldier'));
    const soldier_div = soldier_role === undefined ? null : `${soldier_role.name.substring(0, soldier_role.name.indexOf(' '))}`;
    const demo_role = member.roles.cache.find((role) => role.name.includes('Demo'));
    const demo_div = demo_role === undefined ? null : `${demo_role.name.substring(0, demo_role.name.indexOf(' '))}`;

    db.run(`UPDATE player
      SET soldier_division = ?,
          demo_division = ?
      WHERE discord_id = ?`,
      soldier_div, demo_div, member.id);
  });
}

// sets Tempus ID and Steam URL
function setIds(discord_id, tempus_id, steam_id32) {
  const W = parseInt(steam_id32.substring(steam_id32.lastIndexOf(':') + 1)) * 2 + 1;
  const steam_url = `https://steamcommunity.com/profiles/[U:1:${W}]`;
  db.run(`UPDATE player
    SET tempus_id = ?,
        steam_url = ?
    WHERE discord_id = ?`,
    tempus_id, steam_url, discord_id);
}

function closeDB() {
  db.close();
}

module.exports = {
  openDB,
  createPlayer,
  setDisplayName,
  setDivision,
  setDivisionsFromRoles,
  setIds,
  closeDB
};