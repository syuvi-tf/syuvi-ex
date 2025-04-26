const { SlashCommandBuilder, PermissionFlagsBits, inlineCode } = require('discord.js');
const sqlite = require('sqlite3');
const divisionRoles = require('../../imports/divisions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setdivision')
    .setDescription('updates a player\'s division')
    .addUserOption(option =>
      option.setName('player')
        .setDescription('@mention')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('class')
        .setDescription('player class')
        .setRequired(true)
        .addChoices(
          { name: 'Soldier', value: 'Soldier' },
          { name: 'Demo', value: 'Demo' },)
    )
    .addStringOption(option =>
      option.setName('division')
        .setDescription('player division')
        .setRequired(true)
        .addChoices(
          { name: 'Platinum', value: 'Platinum' },
          { name: 'Gold', value: 'Gold' },
          { name: 'Silver', value: 'Silver' },
          { name: 'Bronze', value: 'Bronze' },
          { name: 'Steel', value: 'Steel' },
          { name: 'Wood', value: 'Wood' },
          { name: 'None', value: 'None' },)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const db = new sqlite.Database('jump.db');
    const member = interaction.options.getMember('player');
    const playerclass = interaction.options.getString('class');
    const division = interaction.options.getString('division');

    const roleToAdd = member.guild.roles.cache.get(divisionRoles.get(`${division} ${playerclass}`));
    const roleToRemove = member.roles.cache.find((role) => role.name.includes(playerclass));
    let replyContent = '';
    db.run(`INSERT OR IGNORE INTO players(userId, userDisplayName)
      VALUES (?, ?)`, member.id, member.displayName);

    if (roleToRemove !== undefined) { //if an old role exists, remove it
      member.roles.remove(roleToRemove);
      replyContent += (`removed ${inlineCode(roleToRemove.name)} from ${inlineCode(member.displayName)}\n`);
    }

    if (division !== 'None') {
      member.roles.add(roleToAdd);
      db.run(`UPDATE players
        SET ${playerclass === 'Soldier' ? 'soldierDiv' : 'demoDiv'} = ?
        WHERE userId = ?`, division, member.id);
      replyContent += (`added ${inlineCode(roleToAdd.name)} to ${inlineCode(member.displayName)}`);
    }

    await interaction.editReply(replyContent);
    db.close();
  },
};