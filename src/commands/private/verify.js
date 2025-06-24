const { SlashCommandBuilder, PermissionFlagsBits, inlineCode, subtext, userMention } = require('discord.js');
const { verifyTourneyTime, getPlayerByID, getTime } = require('../../lib/database.js');
const { formatTime } = require('../../lib/components.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('verify a player\'s tourney time')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option.setName('time_id')
        .setDescription('from the submitted time\'s message')
        .setMinValue(1)
        .setMaxValue(999999)
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); // thinking...
    const time_id = interaction.options.getInteger('time_id');
    const time = getTime(time_id);
    if (time) {
      const player = getPlayerByID(time.player_id);
      verifyTourneyTime(time_id);
      interaction.editReply({ content: `✅ Verified a ${formatTime(time.run_time, true)} for ${userMention(player.discord_id)}`, allowedMentions: { users: [] } });
    }
    else {
      interaction.editReply(`❌ Couldn't find a time to verify.`);
    }
  },
};