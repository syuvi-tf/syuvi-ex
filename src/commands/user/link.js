const { SlashCommandBuilder, inlineCode } = require('discord.js');
const sqlite = require('sqlite3');

function updateIds_DB(userId, tempusId, steamId32) {
  const W = parseInt(steamId32.substring(steamId32.lastIndexOf(':') + 1)) * 2 + 1;
  const steamUrl = `https://steamcommunity.com/profiles/[U:1:${W}]`;
  const db = new sqlite.Database('jump.db');
  db.run(`UPDATE players
    SET tempusId = ?,
        steamUrl = ?
    WHERE userId = ?`, tempusId, steamUrl, userId);
  db.close();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('sets your Tempus ID and Steam profile')
    .addIntegerOption(option =>
      option.setName('tempus_id')
        .setDescription('from your tempus2.xyz url')
        .setMinValue(1)
        .setMaxValue(9999999)
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const tempusId = interaction.options.getInteger('tempus_id');
    const userId = interaction.user.id;

    const response = await (await fetch(`https://tempus2.xyz/api/v0/players/id/${tempusId}/info`)).json();
    const tempusName = response.name;
    const steamId32 = response.steamid;

    updateIds_DB(userId, tempusId, steamId32);
    await interaction.editReply(`set your Tempus ID\n` +
      `your last known tempus alias is ${inlineCode(tempusName)}`);
  },
};