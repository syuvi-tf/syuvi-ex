import * as sqlite3 from 'sqlite3';
import { Database, open, Statement } from 'sqlite';

const path: string = process.env.FLY_APP_NAME ? '/litefs/db' : 'jump.db';
const db: Database = await openDB(path);

async function openDB(path: string): Promise<Database> {
  console.log(`[sqlite] attempting to open ${path}`);
  return await open({
    filename: path,
    driver: sqlite3.Database,
  });
}

async function createTables(): Promise<void> {
  console.log('[sqlite] attempting to create database tables..');

  const results: RunResult[] = [];
  const statements: Statement[] = [];

  statements.push(
    await db.prepare(`--sql
    create table if not exists competition_division(
      id integer not null primary key autoincrement
      competition_id integer not null,
      division text not null,
      map text not null
    )`)
  );

  statements.push(
    await db.prepare(`--sql
    create table if not exists competition(
      id integer not null primary key autoincrement
    )`)
  );

  statements.push(
    await db.prepare(`--sql
    create table if not exists player(
      id integer not null primary key autoincrement,
      discord_id text not null unique,
      steam_id text,
      tempus_id text,
      display_name text not null,
      soldier_division text,
      demo_division text,
      created_at datetime not null default current_timestamp
    )`)
  );

  statements.push(
    await db.prepare(`--sql
    create table if not exists marathon(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      signup_message_id text,
      phase text not null,
      class text not null,
      starts_at datetime not null,
      ends_at datetime not null,
      created_at datetime not null default current_timestamp,
      foreign key (competition_id) references competition (id)
    )`)
  );

  statements.push(
    await db.prepare(`--sql
    create table if not exists minithon(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      phase text not null,
      class text not null,
      starts_at datetime not null,
      ends_at datetime not null,
      created_at datetime not null default current_timestamp,
      foreign key (competition_id) references competition (id)
    )`)
  );

  statements.push(
    await db.prepare(`--sql
    create table if not exists bounty(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      phase text not null,
      bounty_type text not null,
      class text not null,
      starts_at datetime not null,
      ends_at datetime not null,
      created_at datetime not null default current_timestamp,
      foreign key (competition_id) references competition (id)
    )`)
  );

  statements.push(
    await db.prepare(`--sql
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
    await db.prepare(`--sql
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
    await db.prepare(`--sql
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

  for (const statement of statements) {
    const result: RunResult = await statement.run();
    results.push(result);
  }
}

async function close(): Promise<void> {
  console.log('[sqlite] attempting to close the database..');
  return await db.close();
}

export class Player {
  async getPlayer(id: number): Promise<Player | undefined> {
    const select = await db.prepare(`--sql
      select * from player
      where id = ?`);
    return await select.get(id);
  }

  async getPlayerByDiscordID(discord_id: string): Promise<Player | undefined> {
    const select = await db.prepare(`--sql
      select * from player
      where discord_id = ?`);
    return await select.get(discord_id);
  }
}

export default { createTables, close, Player };
