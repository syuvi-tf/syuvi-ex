import dotenv from 'dotenv';
import { Client, Collection, Events, GatewayIntentBits, Partials } from 'discord.js';
import commands from './commands.js';
import events from './events.js';

dotenv.config();

// create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Reaction],
});

client.commands = new Collection();
for (const command of commands) {
  if (!command.data || !command.execute) {
    console.log(`[warning] a command is missing required "data" or "execute" property`);
    continue;
  }

  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, (client) => events.clientready.execute(client));
client.on(Events.InteractionCreate, (interaction) => events.interactioncreate.execute(interaction));
// for (const event of events) {
//   if (event.once) {
//     client.once(event.name, (...args) => event.execute(...args));
//   } else {
//     client.on(event.name, (...args) => event.execute(...args));
//   }
// }

client.login(process.env.DISCORD_TOKEN);
