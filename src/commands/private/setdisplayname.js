const { SlashCommandBuilder, PermissionFlagsBits, userMention } = require('discord.js');
const { updatePlayerDisplayName, getPlayer, createPlayer } = require('../../lib/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setdisplayname')
    .setDescription('sets a player\'s display name from their discord nickname')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(option =>
      option.setName('player')
        .setDescription('@mention')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const user = interaction.options.getUser('player');
    getPlayer(user.id) ?? createPlayer(user.id, user.displayName);
    updatePlayerDisplayName(user.id, user.displayName);
    interaction.editReply({ content: `✅ Set ${userMention(user.id)}'s tourney display name`, allowedMentions: { users: [] } });
  },
};