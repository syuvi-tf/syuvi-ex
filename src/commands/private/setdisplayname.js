const { SlashCommandBuilder, PermissionFlagsBits, inlineCode } = require('discord.js');
const { setDisplayName } = require('../../lib/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setdisplayname')
    .setDescription('sets a player\'s display name')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option =>
      option.setName('player')
        .setDescription('@mention')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const member = interaction.options.getMember('player');
    setDisplayName(member.id, member.displayName);
    interaction.editReply(`set ${inlineCode(member.displayName)}'s display name`);
  },
};