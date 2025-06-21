const { SlashCommandBuilder, inlineCode, PermissionFlagsBits } = require('discord.js');
const { verifyTourneyTimes, getActiveTourney } = require('../../lib/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('verify a player\'s tourney time')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(option =>
      option.setName('player')
        .setDescription('@mention')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); // thinking...
    const member = interaction.options.getMember('player');
    const trny = getActiveTourney();
    if (trny) {
      verifyTourneyTimes(trny.id, member.id);
      interaction.editReply(`✅ Verified ${inlineCode(member.displayName)}'s tourney times.`);
    }
    else {
      interaction.editReply(`❌ Couldn't verify ${inlineCode(member.displayName)}'s tourney times.. is there an ongoing tourney?`);
    }
  },
};