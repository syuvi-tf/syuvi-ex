const { SlashCommandBuilder, PermissionFlagsBits, inlineCode } = require('discord.js');
const { updateDisplayName } = require('../../lib/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('updatename')
    .setDescription('updates a player\'s display name')
    .addUserOption(option =>
      option.setName('player')
        .setDescription('@mention')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const member = interaction.options.getMember('player');
    updateDisplayName(member.id, member.displayName);
    interaction.editReply(`updated ${inlineCode(member.displayName)}'s display name`);
  },
};