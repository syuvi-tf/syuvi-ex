const { SlashCommandBuilder, PermissionFlagsBits, userMention, subtext } = require('discord.js');
const { getPlayer, createPlayer, getActiveTourney, getRecentTourney, getTourneyPlayer, createTourneyTime } = require('../../lib/database.js');

// return String[] of {MM,SS,ss} or {SS,ss}
function getTimeParts(time) {
  const partRegex = /\d{1,2}/g;
  return time.match(partRegex);
}

function isValidTime(time) {
  const validRegex = /^((\d{0,2}):)?(\d{2}).(\d{2})$/g;
  return validRegex.test(time);
}

function getTourneyMap(trny, division) {
  switch (division) {
    case 'Platinum':
    case 'Gold':
      return trny.plat_gold_map;
    case 'Silver':
      return trny.silver_map;
    case 'Bronze':
      return trny.bronze_map;
    case 'Steel':
      return trny.steel_map;
    case 'Wood':
      return trny.wood_map;
    default:
      console.log(`/forcesubmit error: couldn't find a tourney map..`);
  }
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
    const trny_class = trny.class === 'Soldier' ? 3 : 4;
    const division = trny_class === 3 ? player.soldier_division : player.demo_division;

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
        const timeParts = getTimeParts(time);
        const timeSeconds = timeParts.length === 2 ? parseFloat(time) //SS.ss
          : parseFloat(`${(parseInt(timeParts[0]) * 60) + parseInt(timeParts[1])}.${timeParts[2]}`);
        const time_id = createTourneyTime(trny.id, player.id, timeSeconds, true);
        interaction.editReply(
          {
            content: `✅ Force submitted a ${time} for ${userMention(user.id)} on ${getTourneyMap(trny, division)}
${subtext(`tourney ID: ${trny.id}`)}
${subtext(`time ID: ${time_id}`)}`, allowedMentions: { users: [] }
          }
        );
      }
    }
  },
};