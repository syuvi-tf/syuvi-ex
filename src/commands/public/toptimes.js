const { SlashCommandBuilder } = require('discord.js');
const { getPlayer, createPlayer, getActiveTourney, getRecentTourney } = require('../../lib/database.js');
const { getTourneyTopTimesEmbed } = require('../../lib/components.js');
const { divisionRoleIds } = require('../../lib/guild-ids.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toptimes')
    .setDescription('display the top 8 times for the current / previous tourney')
    .addStringOption(option =>
      option.setName('division')
        .setDescription('division top times to display')
        .addChoices(
          { name: 'Platinum', value: 'Platinum' },
          { name: 'Gold', value: 'Gold' },
          { name: 'Silver', value: 'Silver' },
          { name: 'Bronze', value: 'Bronze' },
          { name: 'Steel', value: 'Steel' },
          { name: 'Wood', value: 'Wood' },)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const trny = getActiveTourney() ?? getRecentTourney();
    const member = interaction.member;
    const division_name = interaction.options.getString('division') ?? null;
    if (!trny) {
      interaction.editReply(`Couldn't find a tourney to display a leaderboard for..`);
    }
    else {
      if (!division_name) {
        // no division name, use player's div if they have one
        const player = getPlayer(member.id) ?? createPlayer(member.id);
        const player_division_name = (trny.class === 'Soldier' ? player.soldier_division : player.demo_division);
        if (player_division_name) {
          // embed leaderboard for player's division
          interaction.editReply({ embeds: [getTourneyTopTimesEmbed(trny, player_division_name, interaction.guild.roles)] });
        }
        else {
          interaction.editReply(`Couldn't display a leaderboard, as you don't have a ${trny.class} division.`);
        }
      }
      else {
        // run normally
        if (trny.class === 'Demo' && division_name === 'Wood') {
          interaction.editReply('There is no Wood Demo leaderboard..');
        }
        else {
          // embed for selected division
          interaction.editReply({ embeds: [getTourneyTopTimesEmbed(trny, division_name, interaction.guild.roles)] });
        }
      }
    }
  },
};