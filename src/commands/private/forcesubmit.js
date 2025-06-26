const { SlashCommandBuilder, PermissionFlagsBits, userMention, subtext } = require('discord.js');
const { getPlayer, createPlayer, getActiveTourney, getRecentTourney, getTourneyPlayer, createTourneyTime } = require('../../lib/database.js');
const { getTourneyMap, isValidTime, getTimeSectionsArray } = require('../../lib/shared-functions.js');

function getForceSubmitEmbed(player_id, time, time_id, trnyclass, map) {
  const embed = new EmbedBuilder()
    .setColor('A69ED7')
    .setDescription(`TF2PJ | (${trnyclass}) Force submitted a ${time} for ${userMention(player_id)}
on ${map}
${subtext(`time ID: ${time_id}`)}

${subtext(`force submitted: this time skipped PR checks.`)}`);
  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forcesubmit')
    .setDescription('manually submit a time for a player')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(option =>
      option.setName('player')
        .setDescription('@mention')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('time')
        .setDescription('format: MM:SS.SS')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const user = interaction.options.getUser('player');
    const time = interaction.options.getString('time');
    const player = getPlayer(user.id) ?? createPlayer(user.id);
    const trny = getActiveTourney() ?? getRecentTourney();
    const division = trny.class === 'Soldier' ? player.soldier_division : player.demo_division;

    if (!isValidTime(time)) {
      await interaction.editReply({
        content: `Couldn't force submit this time, as it's not in the expected format.
${subtext(`format: MM:SS.ss / SS.ss`)}`,
      });
    }
    else {
      if (!trny || !division || !getTourneyPlayer(trny.id, player.id) || getTourneyPlayer(trny.id, player.id).signed_up === 0) {
        interaction.editReply(`❌ Couldn't manually submit this time. Couldn't find an ongoing / recent tourney, or this player is missing a division, or this player wasn't signed up.`);
      }
      else {
        const timeSections = getTimeSectionsArray(time);
        const timeSeconds = timeSections.length === 2 ? parseFloat(time) //SS.ss
          : parseFloat(`${(parseInt(timeSections[0]) * 60) + parseInt(timeSections[1])}.${timeSections[2]}`);
        const time_id = createTourneyTime(trny.id, player.id, timeSeconds, true);
        interaction.editReply(
          {
            embeds: [getForceSubmitEmbed(player.id, timeSeconds, time_id, trny.class, getTourneyMap(trny, division))]
          }
        );
      }
    }
  },
};