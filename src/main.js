import fs from "node:fs";
import path from "node:path";
import express from "express";
import dotenv from "dotenv";
import { Client, Collection, Events, GatewayIntentBits, Partials, MessageFlags } from 'discord.js';
import { openDB, getActiveTourney, closeDB } from './lib/database.js';
import { signupsChannelId } from './lib/guild-ids.js';
import { signupsReactionAdd, signupsReactionRemove } from './events/signup-reaction.js';
import { memberJoin } from './events/member-join.js';
import { startTourneyJob, endTourneyJob, updateSignupsJob, updateSheetsJob } from './lib/schedules.js';

dotenv.config();

const expressApp = express();
expressApp.get('/', (_, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send('{"status":"OK"}');
});
expressApp.listen(3000, () => console.log("Status API listening on port 3000"));

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
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers],
    partials: [Partials.Message, Partials.Reaction]
  });

getCommands(client);

// when the client is ready, run this code (only once)
client.once(Events.ClientReady, readyClient => {
  console.log(`ready! logged in as ${readyClient.user.tag}`);
  openDB();
  // if there is an active or upcoming tourney, schedule jobs
  const trny = getActiveTourney();
  const now = new Date(new Date().toUTCString());
  if (trny) {
    if ((new Date(trny.starts_at) > now)) // tourney hasn't started yet
    {
      startTourneyJob(trny.starts_at, client.channels.cache);
    }
    else if ((new Date(trny.starts_at) < now)) // tourney has started, but has not ended yet
    {
      updateSheetsJob();
    }
    // tourney hasn't ended yet
    endTourneyJob(trny.ends_at, client.channels.cache, trny);
    updateSignupsJob(client.channels.cache.get(signupsChannelId));
  }
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

// give user division roles back from db, if they had any
client.on(Events.GuildMemberAdd, async (member) => {
  memberJoin(member);
});

// log in to discord with client token
client.login(process.env.DISCORD_TOKEN);

process.on('beforeExit', () => {
  closeDB();
});