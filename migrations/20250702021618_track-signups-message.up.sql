-- its not feasible to add the `signup_message_id` column to the table without replacing the table
-- so, I'll just make a new table.
create table tournament_signup_message (
    id integer not null primary key autoincrement,
    tournament_id integer not null references tournament(id),
    discord_id text not null,
    created_at datetime not null default (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

    unique (discord_id)
);
