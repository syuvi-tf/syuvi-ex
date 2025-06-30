![syuvi](https://github.com/user-attachments/assets/03daef07-fc0b-41db-bb3a-f052a7640241)

## Command List

> [!NOTE]
> these are sorted by Discord permission\
> `[option]` is a required slash command option\
> `(option)` is an optional slash command option

<ins>Public Commands</ins>\
`/link [Tempus ID]` - link Tempus ID, used to verify `/submit`'ed Tempus PR times, and displayed in `/profile`\
`/submit [time]` - submit a verified (Tempus PR) or unverified (slower than Tempus PR) time for the ongoing tournament's map, according to player division.\
`/toptimes (division)` - view Top 8 times for the ongoing (or previous) tournament\
`/profile (@user)` - view a player's profile (display name, divisions, tempus & steam profile)\
`/randommap (tier) (rating)` - get a random map from the current Tempus map list

<ins>Administrator Commands</ins>\
`/createtourney [class] [month] [day] (offset)` - create and open signups for a new tournament at midnight + `(offset)` UTC\
`/settourneymap [division] [map] ` - change the upcoming tourney's map before the tourney has started\
`/refreshdivisions` - update division(s) for every player with at least one division discord role\
`/removetime [time_id]` - remove a player's time\
`/echo [#channel]` - echo last message sent (in this channel) to another channel

<ins>ManageMessages Commands</ins>\
`/setdisplayname [@user]` - update a player's display name (sheet alias) using their server nickname\
`/setdivision [@user] [class] [division]` - update a player's division\
`/verify [time_id]` - verify a previously unverified tournament time\
`/forcesubmit [@user] [time]` - force submit a time for a player

## Development

### Getting Started

Install Prerequisites:

- [flyctl](https://fly.io/docs/flyctl/) (optional, only if you're deploying this to fly.io)
- Node.js v24
- Docker (optional, only needed for local container testing)

Install local dependencies:

```sh
npm i
```

Setup test envvars in `.env`:

```sh
DISCORD_TOKEN="..."
SHEETS_CLIENT_EMAIL="GCP/Google Services client email"
SHEETS_PRIVATE_KEY="private key for GCP/Google Services"
SHEETS_SPREADSHEET_ID="ID of the spreadsheet to render tournament details to"
```

Run the bot:

```
node .
```

### Deploying

This section is for maintainers with deployment permissions.

#### For the first time

WIP: instructions for separating environments (e.g. test vs production), and for creating apps in the dashboard

Create a volume big enough to hold the database, and name it `litefs`:

```sh
flyctl volumes create litefs --size 10
```

Create the app config, without deploying, replacing `app-name-here` and `app-name.fly.toml` with appropriate values (e.g. `syuvi-test` and `test.fly.toml`):

```sh
flyctl launch --name app-name-here --config env-name.fly.toml --no-deploy
```

Attach a Consul cluster to the app

```sh
flyctl consul attach
```

Mount the `litefs` volume to the fly app, in `app-name.fly.toml` (e.g. `test.fly.toml`):

```toml
[mounts]
  source = "litefs"
  destination = "/var/lib/litefs"
```

Add environment secrets to the app:

```sh
fly secrets import <.env
```

Deploy the app!

```sh
fly deploy --config env-name.fly.toml
```

#### After that

If your code change DOES NOT involve a change to the sql schema then:

1. make your changes!
1. test your changes locally!
1. commit your changes!
1. `fly deploy` & monitor deployment!

### Creating and Managing Migrations

We use [golang-migrate](https://github.com/golang-migrate/migrate).

#### Installing `golang-migrate`

> [!IMPORTANT]
> The recommended installation requires the Go toolchain. If you don't want to install Go, follow the [instructions here](https://github.com/golang-migrate/migrate/tree/master/cmd/migrate) for other methods of installing `golang-migrate`. If you follow those instructions, make sure you install version `4.18.3`.

Prerequisites:

-  [Go v1.24](https://go.dev/dl/)

Install `golang-migrate` go package:

```sh
go install -tags 'sqlite3' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.3
```

If successful, you should see this when running `migrate`:

```sh
Usage: migrate OPTIONS COMMAND [arg...]
       migrate [ -version | -help ]

Options:
  -source          Location of the migrations (driver://url)
  -path            Shorthand for -source=file://path
  -database        Run migrations against this database (driver://url)
  -prefetch N      Number of migrations to load in advance before executing (default 10)
  -lock-timeout N  Allow N seconds to acquire database lock (default 15)
  -verbose         Print verbose logging
  -version         Print version
  -help            Print usage

Commands:
  create [-ext E] [-dir D] [-seq] [-digits N] [-format] [-tz] NAME
           Create a set of timestamped up/down migrations titled NAME, in directory D with extension E.
           Use -seq option to generate sequential up/down migrations with N digits.
           Use -format option to specify a Go time format string. Note: migrations with the same time cause "duplicate migration version" error.
           Use -tz option to specify the timezone that will be used when generating non-sequential migrations (defaults: UTC).

  goto V       Migrate to version V
  up [N]       Apply all or N up migrations
  down [N] [-all]    Apply all or N down migrations
        Use -all to apply all down migrations
  drop [-f]    Drop everything inside database
        Use -f to bypass confirmation
  force V      Set version V but don't run migration (ignores dirty state)
  version      Print current migration version

Source drivers: file
Database drivers: stub, sqlite3
```

> [!NOTE]
> If you see something like `command not found`, chances are the gopath `go/bin` directory isn't on your `PATH`! This is usually located in your home directory e.g. `C:/Users/YourUserName/go/bin` or `/home/username/go/bin`.

#### Creating a New Migration

Whenever you want to make changes to the database schema, you need to make a migration:

```sh
migrate create -ext sql -dir migrations a-summary-of-your-changes
```

This will create two new files in the migrations directory, like this:

```
migrations/20250630213652_a-summary-of-your-changes.down.sql
migrations/20250630213652_a-summary-of-your-changes.up.sql
```

These files are where you should write **idempotent** SQL to make changes to the schema. SQL statements are idempotent if they can be ran multiple times in a row with the same result.

For example, this is NOT idempotent:

```sql
CREATE TABLE something (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
);
```

If ran multiple times, the `CREATE TABLE` statement will fail due to a conflict with an existing table. To make it idempotent, use `IF NOT EXISTS`:

```sql
CREATE TABLE IF NOT EXISTS something (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
);
```
