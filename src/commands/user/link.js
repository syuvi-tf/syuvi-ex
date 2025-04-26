const { SlashCommandBuilder, inlineCode } = require('discord.js');
const sqlite = require('sqlite3');

function setTempusId_DB(tempusId, userId) {
  const db = new sqlite.Database('jump.db');
  db.run(`UPDATE players
    SET tempusId = '${tempusId}'
    WHERE userId = '${userId}'`);
  db.close();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('sets your Tempus ID')
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

    setTempusId_DB(tempusId, userId);
    const response = await (await fetch(`https://tempus2.xyz/api/v0/players/id/${tempusId}/info`)).json();
    const tempusName = response.name;
    await interaction.editReply(`set your Tempus ID.\n
       last known Tempus alias: ${inlineCode(tempusName)}`);
  },
};