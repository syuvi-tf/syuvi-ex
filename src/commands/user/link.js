const { SlashCommandBuilder, inlineCode } = require('discord.js');
const { updateIds } = require('../../lib/database.js');

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

    updateIds(userId, tempusId, steamId32);
    await interaction.editReply(`set your Tempus ID\n` +
      `your last known tempus alias is ${inlineCode(tempusName)}`);
  },
};