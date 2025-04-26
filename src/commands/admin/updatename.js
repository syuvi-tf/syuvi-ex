const { SlashCommandBuilder, PermissionFlagsBits, inlineCode } = require('discord.js');
const sqlite = require('sqlite3');

function updateDisplayName_DB(userId, displayName) {
  const db = new sqlite.Database('jump.db');
  db.run(`UPDATE players
    SET displayName = ?,
    WHERE userId = ?`, displayName, userId);
  db.close();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setdisplayname')
    .setDescription('updates a player\'s display name')
    .addUserOption(option =>
      option.setName('player')
        .setDescription('@mention')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const member = interaction.options.getMember('player');
    updateDisplayName_DB(member.id, member.displayName);
    interaction.editReply(`updated ${inlineCode(member.displayName)}'s display name`);
  },
};