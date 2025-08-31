import sqlite3 from 'sqlite3';
import { Database, open, Statement } from 'sqlite';
import { type ISqlite } from 'sqlite';
type RunResult = ISqlite.RunResult<sqlite3.Statement>;

sqlite3.verbose();
const path: string = process.env.FLY_APP_NAME ? '/litefs/db' : 'jump.db';
const db: Database = await openDB(path);

async function openDB(path: string): Promise<Database> {
  console.log(`[sqlite] opening ${path}`);
  return await open({
    filename: path,
    driver: sqlite3.Database,
  });
}

async function createTables(): Promise<void> {
  console.log('[sqlite] checking database tables');

  const results: RunResult[] = [];
  const statements: Statement[] = [];

  statements.push(
    await db.prepare(`--sql
    create table if not exists player(
      id integer not null primary key autoincrement,
      discord_id text not null unique,
      steam_id text unique,
      tempus_id text unique,
      steam_trade_token text unique,
      display_name text not null,
      soldier_division text,
      demo_division text,
      created_at datetime not null default current_timestamp
    )`)
  );

  statements.push(
    await db.prepare(`--sql
    create table if not exists competition(
      id integer not null primary key autoincrement,
      class text not null,
      starts_at datetime not null,
      ends_at datetime not null,
      created_at datetime not null default current_timestamp
    )`)
  );

  statements.push(
    await db.prepare(`--sql
    create table if not exists competition_division(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      division text not null,
      placements integer not null,
      map text not null
    )`)
  );

  statements.push(
    await db.prepare(`--sql
    create table if not exists marathon(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      signup_message_id text unique,
      phase text not null,
      foreign key (competition_id) references competition (id)
    )`)
  );

  statements.push(
    await db.prepare(`--sql
    create table if not exists minithon(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      phase text not null,
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
      foreign key (competition_id) references competition (id)
    )`)
  );

  statements.push(
    await db.prepare(`--sql
    create table if not exists motw(
      id integer not null primary key autoincrement,
      competition_id integer not null,
      phase text not null,
      map text not null,
      foreign key (competition_id) references competition (id)
    )`)
  );

  statements.push(
    await db.prepare(`--sql
    create table if not exists competition_player(
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

export class PlayerTable {
  static async get(id: number): Promise<Player | undefined> {
    const select = await db.prepare(`--sql
      select * from player
      where id = ?`);
    return await select.get<Player>(id);
  }

  static async getByDiscordID(discord_id: string): Promise<Player | undefined> {
    const select = await db.prepare(`--sql
      select * from player
      where discord_id = ?`);
    return await select.get<Player>(discord_id);
  }
}

export class MarathonTable {
  static async getAllByPhases(...phases: MarathonPhase[]): Promise<Marathon[]> {
    const select = await db.prepare(`--sql
      select * from competition 
      join marathon on competition.id = marathon.competition_id
      where phase = ?
      order by competition_id desc`);

    const marathons: Marathon[] = [];
    for (const phase of phases) {
      marathons.concat(await select.all<Marathon>(phase));
    }

    return marathons;
  }
}

export default { createTables, close, PlayerTable, MarathonTable };
