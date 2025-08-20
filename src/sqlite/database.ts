import Database, { type RunResult, type Statement } from 'better-sqlite3';
import Dev from '../lib/dev.js';

const dbPath = process.env.FLY_APP_NAME ? '/litefs/db' : 'jump.db';
const db = new Database(dbPath);

function createTables() {
  const runResults: RunResult[] = [];
  const statements: Statement[] = [];

  statements.push(
    db.prepare(`--sql
    create table if not exists competition(
      id integer not null primary key autoincrement
    )`)
  );
  statements.push(
    db.prepare(`--sql
    create table if not exists player(
      id integer not null primary key autoincrement,
      discord_id text not null unique,
      display_name text not null,
      soldier_division text,
      demo_division text,
      tempus_id integer,
      steam_id text,
      created_at datetime not null default current_timestamp
    )`)
  );

  statements.push(
    db.prepare(`--sql
    create table if not exists marathon(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      signup_message_id text,
      phase text not null,
      class text not null,
      plat_map text not null,
      gold_map text not null,
      silver_map text not null,
      bronze_map text not null,
      steel_map text not null,
      wood_map text not null,
      starts_at datetime not null,
      ends_at datetime not null,
      created_at datetime not null default current_timestamp,
      foreign key (competition_id) references competition (id)
    )`)
  );

  statements.push(
    db.prepare(`--sql
    create table if not exists minithon(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      phase text not null,
      class text not null,
      plat_map text not null,
      gold_map text not null,
      silver_map text not null,
      bronze_map text not null,
      steel_map text not null,
      wood_map text not null,
      starts_at datetime not null,
      ends_at datetime not null,
      created_at datetime not null default current_timestamp,
      foreign key (competition_id) references competition (id)
    )`)
  );

  statements.push(
    db.prepare(`--sql
    create table if not exists bounty(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      phase text not null,
      bounty_type text not null,
      class text not null,
      division text not null,
      map text not null,
      starts_at datetime not null,
      ends_at datetime not null,
      created_at datetime not null default current_timestamp,
      foreign key (competition_id) references competition (id)
    )`)
  );

  statements.push(
    db.prepare(`--sql
    create table if not exists motw(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      phase text not null,
      class text not null,
      map text not null,
      ends_at datetime not null,
      created_at datetime not null default current_timestamp,
      foreign key (competition_id) references competition (id)
    )`)
  );

  statements.push(
    db.prepare(`--sql
    create table if not exists marathon_player(
      marathon_id integer not null,
      player_id integer not null,
      signed_up boolean not null,
      division text,
      created_at datetime not null default current_timestamp,
      primary key (marathon_id, player_id),
      foreign key (marathon_id) references marathon (id),
      foreign key (player_id) references player (id)
    )`)
  );

  statements.push(
    db.prepare(`--sql
    create table if not exists player_time(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      player_id integer not null,
      run_time float not null,
      verified boolean not null,
      created_at datetime not null default current_timestamp,
      foreign key (competition_id) references competition (id),
      foreign key (player_id) references player (id)
    )`)
  );

  console.log('[SQLITE] attempting to create database tables.');

  for (const statement of statements) {
    try {
      runResults.push(statement.run());
    } catch (error) {
      Dev.logError(error);
    }
  }
}
function close() {
  db.close();
}

export default { createTables, close };
