const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, Partials, MessageFlags, EmbedBuilder, userMention } = require('discord.js');
const dotenv = require('dotenv');
const { openDB, getTourneyTimes, getPlayerId, getDivision, getLatestTournament, createTournamentPlayer, removeTournamentPlayer, closeDB } = require('./lib/database.js');
const { signupsChannelId } = require('./lib/guild-specific.js');
let signupsMessageId;
dotenv.config();
const token = process.env.DISCORD_TOKEN;

// create a new client instance
const client = new Client(
  {
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Reaction]
  });
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

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

async function setSignupsMessageId() {
  signupsMessageId = (await getLatestTournament()).message_id;
}

// when the client is ready, run this code (only once)
client.once(Events.ClientReady, readyClient => {
  console.log(`ready! logged in as ${readyClient.user.tag}`);
  openDB();
  getTourneyTimes();
  setSignupsMessageId();
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'encountered an error running this command', flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: 'encountered an error running this command', flags: MessageFlags.Ephemeral });
    }
  }
});

// add player to tourney on signup reaction
// TODO: this should query the database to update signed up users (and update the entire embed, not just the one field).
//       otherwise, what happens when a user's division is changed and they un-sign up? (etc)
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  const message = reaction.message;
  if (message.channelId === signupsChannelId && reaction.emoji.name === '✅') {
    const trny = await getLatestTournament();
    const player_id = await getPlayerId(user.id);
    const playerDivision = await getDivision(player_id, trny.class);
    createTournamentPlayer(trny.id, player_id, playerDivision, true);
    const fullMessage = message.partial ? await message.fetch() : message;
    const messageEmbed = fullMessage.embeds[0];
    const divFieldIndex = messageEmbed.fields.findIndex((field) => field.name === playerDivision);
    const newEmbed = EmbedBuilder.from(messageEmbed).spliceFields(divFieldIndex !== -1 ? divFieldIndex : messageEmbed.fields.length - 1, 1,
      {
        name: messageEmbed.fields[divFieldIndex].name,
        value: messageEmbed.fields[divFieldIndex].value += userMention(user.id)
      });
    fullMessage.edit({ embeds: [newEmbed] });
  }
});

// remove user from tourney on signup reaction
client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (reaction.message.channelId === signupsChannelId && reaction.emoji.name === '✅') {
    const trny = await getLatestTournament();
    const player_id = getPlayerId(user.id);
    removeTournamentPlayer(trny.id, player_id);
  }
});

// log in to discord with client token
client.login(token);

process.on('beforeExit', () => {
  closeDB();
});