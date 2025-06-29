import { SlashCommandBuilder, PermissionFlagsBits, roleMention, userMention } from "discord.js";
import { createPlayer, updatePlayerDivision, getPlayer } from "../../lib/database.js";
import { divisionRoleIds } from "../../lib/guild-ids.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setdivision')
    .setDescription('update a player\'s division')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(option =>
      option.setName('player')
        .setDescription('@user')
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
    await interaction.deferReply(); // thinking...
    const member = interaction.options.getMember('player');
    // first, create a player if they don't exist
    getPlayer(member.id) ?? createPlayer(member.id, member.displayName);
    const divisionClass = interaction.options.getString('class');
    const divisionName = interaction.options.getString('division');
    const division = {
      class: divisionClass,
      name: divisionName === 'None' ? null : divisionName
    };

    if (division.name === 'Wood' && division.class === 'Demo') {
      await interaction.editReply(`❌ Wood Demo is not a valid role.`);
    }
    else {
      const roleToAdd = member.guild.roles.cache.get(divisionRoleIds.get(`${division.name} ${division.class}`));
      const roleToRemove = member.roles.cache.find((role) => role.name.includes(division.class));
      let messageContent = ``;
      if (roleToRemove) { // if an old role exists, remove it
        await member.roles.remove(roleToRemove);
        messageContent += (`removed ${roleMention(roleToRemove.id)} from ${userMention(member.id)}\n`);
      }
      // don't add wood demo role
      if (division.name) { // if there is a role to add, add it
        await member.roles.add(roleToAdd);
        messageContent += (`added ${roleMention(roleToAdd.id)} to ${userMention(member.id)}`);
      }
      updatePlayerDivision(member.id, division);
      if (messageContent !== '') {
        await interaction.editReply({ content: messageContent, allowedMentions: { users: [], roles: [] } });
      }
      else {
        await interaction.editReply({ content: `❌ ${userMention(member.id)} doesn't have a ${division.class} role to remove.`, allowedMentions: { users: [], roles: [] } });
      }
    }
  },
};