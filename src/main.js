import dotenv from 'dotenv';
import { Client, Collection, GatewayIntentBits, Events, MessageFlags, Partials } from 'discord.js';
import commands from './discord/commands/commands.ts';
import { test } from './schedule/marathon.ts';

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

updateCommands(client);

// run once when the bot is online
client.once(Events.ClientReady, (client) => {
  console.log(`ready! logged in as ${client.user.tag}`);

  // schedule routine to run on bot startup

  // test routine
  test();
});

client.on(Events.InteractionCreate, async (interaction) => {
  executeCommand(interaction);
});

process.on('beforeExit', () => {
  // close sqlite database
  console.log(`attempted to close sqlite database before exiting.`);
});

client.login(process.env.DISCORD_TOKEN);

async function executeCommand(interaction) {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`[ERROR] No command matching ${interaction.commandName} was found.`);
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'Encountered an error running this command.',
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: 'Encountered an error running this command.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

function updateCommands(client) {
  client.commands = new Collection();
  for (const command of commands) {
    if (!command.data || !command.execute) {
      console.log(`[WARNING] Command is missing a required "data" or "execute" property.`);
      continue;
    }

    client.commands.set(command.data.name, command);
  }
}
