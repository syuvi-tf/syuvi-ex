const { SlashCommandBuilder, PermissionFlagsBits, userMention } = require('discord.js');
const { getPlayerByID, removeTourneyTime, getTime } = require('../../lib/database.js');
const { formatTime } = require('../../lib/components.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removetime')
    .setDescription('delete a player\'s time')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option =>
      option.setName('time_id')
        .setDescription('from the submitted time\'s message')
        .setMinValue(1)
        .setMaxValue(999999)
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const time_id = interaction.options.getInteger('time_id');
    const time = getTime(time_id);
    if (time) {
      const player = getPlayerByID(time.player_id);
      removeTourneyTime(time_id);
      interaction.editReply({ content: `✅ Removed a ${formatTime(time.run_time, true)} for ${userMention(player.discord_id)}`, allowedMentions: { users: [] } });
    }
    else {
      interaction.editReply(`❌ Couldn't find a time to remove.`);
    }
  },
};