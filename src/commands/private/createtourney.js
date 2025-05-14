const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder } = require('discord.js');
const maps = require('../../lib/maps.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createtourney')
    .setDescription('create and open signups for a new tournament')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    console.log(maps);
    const sent = await interaction.deferReply(); //thinking...
    interaction.editReply(`not yet implemented.`);
  },
};