import Database from 'better-sqlite3';

const db = new Database('jump.db');

function close() {
  db.close();
}

export { close };
