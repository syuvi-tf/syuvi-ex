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
    const response = await (await fetch(`https://tempus2.xyz/api/v0/players/id/${tempusId}/stats`)).json();
    const tempusName = response.player_info.name;
    const steamId = response.player_info.steamid;
    const tempusSoldierRank = response.class_rank_info['3'].rank;
    const tempusDemoRank = response.class_rank_info['4'].rank;

    if (!tempusName || !steamId) {
      await interaction.editReply(`❌ Couldn't set your Tempus ID. Is the ID correct?`);
    }
    else {
      try {
        updatePlayerIds(interaction.user.id, tempusId, steamId);
        await interaction.editReply(`✅ Set your Tempus ID. Your last known Tempus alias is ${inlineCode(tempusName)}
${inlineCode('Rank ' + tempusSoldierRank + ' Soldier')}
${inlineCode('Rank ' + tempusDemoRank + ' Demo')}`);
      }
      catch (error) {
        console.error('/link command error');
        await interaction.editReply(`❌ Couldn't set your Tempus ID. Do you have a division?`);
      }
    }
  },
};