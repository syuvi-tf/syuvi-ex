const { SlashCommandBuilder, PermissionFlagsBits, inlineCode } = require('discord.js');

// setdivision
// requires ManageRoles
//
// adds, overwrites, or removes a specific class's division.
// this will affect a user's division role, as well as updating it in the database.

const divisionRoles = new Map([
  ['Platinum Soldier', '1365102656040734761'],
  ['Gold Soldier', '1365102716283650151'],
  ['Silver Soldier', '1365102762832171171'],
  ['Bronze Soldier', '1365102816955207821'],
  ['Steel Soldier', '1365103400685142208'],
  ['Wood Soldier', '1365102906709250059'],
  ['Platinum Demo', '1365103026808819712'],
  ['Gold Demo', '1365103174016565279'],
  ['Silver Demo', '1365103197219455047'],
  ['Bronze Demo', '1365103224276910090'],
  ['Steel Demo', '1365103360587464824'],
  ['Wood Demo', '1365116741847613590'],
]);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setdivision')
    .setDescription('sets a player\'s division')
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
    const member = interaction.options.getMember('player');
    const playerclass = interaction.options.getString('class');
    const division = interaction.options.getString('division');

    const roleToAdd = member.guild.roles.cache.get(divisionRoles.get(`${division} ${playerclass}`));
    const roleToRemove = member.roles.cache.find((role) => role.name.includes(playerclass));
    let replyContent = '';

    if (roleToRemove !== undefined) { //if an old role exists, remove it
      member.roles.remove(roleToRemove);
      // TODO: remove from db
      replyContent += (`removed ${inlineCode(roleToRemove.name)} role from ${inlineCode(member.displayName)}.\n`);
    }

    if (division !== 'None') {
      member.roles.add(roleToAdd);
      // TODO: add to db
      replyContent += (`added ${inlineCode(roleToAdd.name)} to ${inlineCode(member.displayName)}.`);
    }

    await interaction.editReply(replyContent);
  },
};