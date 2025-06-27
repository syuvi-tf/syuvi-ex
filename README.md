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
`/createtourney [class] [month] [day]` - create and open signups for a new tournament at midnight UTC\
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

- [flyctl](https://fly.io/docs/flyctl/) (optiona, only if you're deploying this to fly.io)
- nodejs v24
- Docker (optional, only needed for local container testing)

Install local dependencies:

```sh
npm i
```

Setup test envvars in `.env`:

```sh
DISCORD_TOKEN="..."
CLIENT_ID="the bot's UID"
GUILD_ID="ID of the guild this instance of the bot is targetting"
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
