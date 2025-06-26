![syuvi](https://github.com/user-attachments/assets/03daef07-fc0b-41db-bb3a-f052a7640241)

## Command List
> [!NOTE]
> these are sorted by Discord permission\
> `[option]` is a required slash command option\
> `(option)` is an optional slash command option

<ins>Public Commands</ins>\
`/link [Tempus ID]` - link Tempus ID, used to verify `/submit`'ed Tempus PR times, and displayed in `/profile`\
`/submit [time]` - submit a verified (Tempus PR) or unverified (slower than Tempus PR) time for the ongoing tournament's map, according to player division.\
`/toptimes (division)` - view Top 8 times for the ongoing (or previous) tournament.\
`/profile (@user)` - view a player's profile (display name, divisions, tempus & steam profile)\
`/randommap (tier) (rating)` - get a random map from the current Tempus map list.

<ins>Administrator Commands</ins>\
`/createtourney [class] [month] [day]` - create and open signups for a new tournament at midnight UTC\
`/removetime [time_id]` - remove a player's time\
`/echo [#channel]` - echo last message sent (in this channel) to another channel

<ins>ManageRoles Commands</ins>\
`/refreshdivisions` - update division(s) for every player with at least one division discord role.\
`/setdivision [@user] [class] [division]` - update a player's division\
`/forcesubmit [@user] [time]` - force submit a time for a player

<ins>ManageMessages Commands</ins>\
`/setdisplayname [@user]` - update a player's display name (sheet alias) using their server nickname.\
`/verify [time_id]` - verify a previously unverified tournament time.
