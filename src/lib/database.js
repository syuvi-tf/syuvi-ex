const sqlite = require('sqlite3');
const db = new sqlite.Database('jump.db');

// open connection to sqlite3 db
function createTable() {
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY NOT NULL,
    displayName TEXT NOT NULL,
    soldierDiv TEXT,
    demoDiv TEXT,
    tempusId TEXT,
    steamUrl TEXT)`);
}

// inserts a new player in the db, if they don't exist
function createPlayer(id, displayName) {
  db.run(`INSERT OR IGNORE INTO players(id, displayName)
      VALUES (?, ?)`, id, displayName);
}

function updateDivision(id, playerclass, division) {
  db.run(`UPDATE players
    SET ${playerclass === 'Soldier' ? 'soldierDiv' : 'demoDiv'} = ?
    WHERE id = ?`, division, id);
}

// updates from discord role, additionally updates displayName
function updateAllDivisions(members) {
  members.forEach(member => {
    const soldierRole = member.roles.cache.find((role) => role.name.includes('Soldier'));
    const soldierDiv = soldierRole === undefined ? null : `${soldierRole.name.substring(0, soldierRole.name.indexOf(' '))}`;
    const demoRole = member.roles.cache.find((role) => role.name.includes('Demo'));
    const demoDiv = demoRole === undefined ? null : `${demoRole.name.substring(0, demoRole.name.indexOf(' '))}`;

    db.run(`UPDATE players
      SET displayName = ?,
          soldierDiv = ?,
          demoDiv = ?
      WHERE id = ?`, member.displayName, soldierDiv, demoDiv, member.id);
  });
}

function updateIds(id, tempusId, steamId32) {
  const W = parseInt(steamId32.substring(steamId32.lastIndexOf(':') + 1)) * 2 + 1;
  const steamUrl = `https://steamcommunity.com/profiles/[U:1:${W}]`;
  db.run(`UPDATE players
    SET tempusId = ?,
        steamUrl = ?
    WHERE userId = ?`, tempusId, steamUrl, id);
}

function updateDisplayName(id, displayName) {
  db.run(`UPDATE players
    SET displayName = ?
    WHERE id = ?`, displayName, id);
}

function closeDB() {
  db.close();
}

module.exports = {
  createTable,
  createPlayer,
  updateDivision,
  updateAllDivisions,
  updateIds,
  updateDisplayName,
  closeDB
};