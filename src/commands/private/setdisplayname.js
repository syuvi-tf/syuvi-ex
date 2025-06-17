const { SlashCommandBuilder, PermissionFlagsBits, inlineCode } = require('discord.js');
const { updatePlayerDisplayName } = require('../../lib/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setdisplayname')
    .setDescription('sets a player\'s display name')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(option =>
      option.setName('player')
        .setDescription('@mention')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const member = interaction.options.getMember('player');
    updatePlayerDisplayName(member.id, member.displayName);
    interaction.editReply(`✅ Set ${inlineCode(member.displayName)}'s tourney display name`);
  },
};