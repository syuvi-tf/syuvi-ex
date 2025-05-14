const { SlashCommandBuilder, PermissionFlagsBits, inlineCode } = require('discord.js');
const { createPlayer, setDivision } = require('../../lib/database.js');
const divisionRoles = require('../../lib/divisions.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setdivision')
    .setDescription('set a player\'s division')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option =>
      option.setName('player')
        .setDescription('@mention')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('class')
        .setDescription('division class')
        .setRequired(true)
        .addChoices(
          { name: 'Soldier', value: 'Soldier' },
          { name: 'Demo', value: 'Demo' },)
    )
    .addStringOption(option =>
      option.setName('division')
        .setDescription('division name')
        .setRequired(true)
        .addChoices(
          { name: 'Platinum', value: 'Platinum' },
          { name: 'Gold', value: 'Gold' },
          { name: 'Silver', value: 'Silver' },
          { name: 'Bronze', value: 'Bronze' },
          { name: 'Steel', value: 'Steel' },
          { name: 'Wood', value: 'Wood' },
          { name: 'None', value: 'None' },)
    ),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const member = interaction.options.getMember('player');
    const playerclass = interaction.options.getString('class');
    const division = interaction.options.getString('division');
    const roleToAdd = member.guild.roles.cache.get(divisionRoles.get(`${division} ${playerclass}`));
    const roleToRemove = member.roles.cache.find((role) => role.name.includes(playerclass));
    let replyContent = '';
    createPlayer(member.id, member.displayName);

    if (roleToRemove !== undefined) { //if an old role exists, remove it
      member.roles.remove(roleToRemove);
      replyContent += (`${inlineCode('- ' + roleToRemove.name)} from ${inlineCode(member.displayName)}\n`);
    }

    if (division !== 'None') {
      member.roles.add(roleToAdd);
      replyContent += (`${inlineCode('+ ' + roleToAdd.name)} to ${inlineCode(member.displayName)}`);
    }
    setDivision(member.id, playerclass, division === 'None' ? null : division);

    await interaction.editReply(replyContent);
  },
};