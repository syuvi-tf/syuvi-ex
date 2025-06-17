const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, Partials, MessageFlags } = require('discord.js');
const dotenv = require('dotenv');
const { openDB, getActiveTourney, closeDB } = require('./lib/database.js');
const { signupsChannelId } = require('./lib/guild-ids.js');
const { signupsReactionAdd, signupsReactionRemove } = require('./events/signup-reaction.js');
const { startTourneyJob, endTourneyJob, updateSignupsJob, updateSheetsJob } = require('./lib/schedules.js');

const { createTourneySheet } = require('./lib/sheet.js');
dotenv.config();

function getCommands(client) {
  const foldersPath = path.join(__dirname, 'commands');
  const commandFolders = fs.readdirSync(foldersPath);
  client.commands = new Collection();
  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      // set a new item in the Collection with the key as the command name and the value as the exported module
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }
}

async function runCommand(interaction) {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }
  try {
    await command.execute(interaction);
  }
  catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'encountered an error running this command', flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: 'encountered an error running this command', flags: MessageFlags.Ephemeral });
    }
  }
}

// create a new client instance
const client = new Client(
  {
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Reaction]
  });

getCommands(client);

// when the client is ready, run this code (only once)
client.once(Events.ClientReady, readyClient => {
  console.log(`ready! logged in as ${readyClient.user.tag}`);
  openDB();
  // if there is an active tourney, we can create the start/end and update jobs
  const trny = getActiveTourney();
  if (getActiveTourney() !== undefined) {
    if ((new Date(trny.starts_at) > new Date(new Date().toUTCString()))) // tourney starts in future
    {
      startTourneyJob(trny.starts_at, client.channels.cache);
    }
    else if ((new Date(trny.starts_at) < new Date(new Date().toUTCString()))) // tourney has started, but has not ended yet
    {
      updateSheetsJob();
    }
    // tourney ends in the future, but may or may not have already started
    endTourneyJob(trny.ends_at, client.channels.cache);
    updateSignupsJob(client.channels.cache.get(signupsChannelId));
  }

  // testing
  createTourneySheet(trny);
  updateSheetsJob();
});

client.on(Events.InteractionCreate, async interaction => {
  runCommand(interaction);
});

// there should only ever be one signups message in #signups, so checking just the channel id should be fine
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (!user.bot && reaction.message.channelId === signupsChannelId && reaction.emoji.name === '✅') {
    signupsReactionAdd(reaction.message, user);
  }
});

// remove user from tourney on signup reaction
client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (reaction.message.channelId === signupsChannelId && reaction.emoji.name === '✅') {
    signupsReactionRemove(reaction.message, user);
  }
});

// log in to discord with client token
client.login(process.env.DISCORD_TOKEN);

process.on('beforeExit', () => {
  closeDB();
});