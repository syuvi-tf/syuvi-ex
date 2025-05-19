const { SlashCommandBuilder, PermissionFlagsBits, inlineCode } = require('discord.js');
const { createPlayer, updatePlayerDivision } = require('../../lib/database.js');
const { divisionRoleIds } = require('../../lib/guild-ids.js');

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
    const divisionClass = interaction.options.getString('class');
    const divisionName = interaction.options.getString('division');
    const division = {
      class: divisionClass,
      name: divisionName === 'None' ? null : divisionName
    };
    const roleToAdd = member.guild.roles.cache.get(divisionRoleIds.get(`${division.name} ${division.class}`));
    const roleToRemove = member.roles.cache.find((role) => role.name.includes(division.class));
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
    updatePlayerDivision(member.id, division);
    await interaction.editReply(replyContent);
  },
};