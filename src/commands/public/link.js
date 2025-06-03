const { SlashCommandBuilder, inlineCode } = require('discord.js');
const { updatePlayerIds } = require('../../lib/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('links your Tempus ID to verify PR times')
    .addIntegerOption(option =>
      option.setName('tempus_id')
        .setDescription('from your tempus2.xyz url')
        .setMinValue(1)
        .setMaxValue(9999999)
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const tempusId = interaction.options.getInteger('tempus_id');
    const response = await (await fetch(`https://tempus2.xyz/api/v0/players/id/${tempusId}/info`)).json();
    const tempusName = response.name;
    const steamId = response.steamid;

    try {
      updatePlayerIds(interaction.user.id, tempusId, steamId);
      await interaction.editReply(`✅ Set your Tempus ID. Your last known Tempus alias is ${inlineCode(tempusName)}`);
    }
    catch (error) {
      console.error('/link command error');
      await interaction.editReply(`❌ couldn't set your Tempus ID. do you have a division?`);
    }
  },
};