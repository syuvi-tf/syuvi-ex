import { SlashCommandBuilder, PermissionFlagsBits, subtext, userMention, EmbedBuilder } from "discord.js";
import { getTourney, verifyTourneyTime, getPlayerByID, getTime } from "../../lib/database.js";
import { getTourneyMap, formatTime } from "../../lib/shared-functions.js";
import { updateSheetTimes } from "../../lib/sheet.js";

function getForceVerifiedEmbed(player_id, time, time_id, trnyclass, map) {
  const embed = new EmbedBuilder()
    .setColor('A69ED7')
    .setDescription(`TF2PJ | (${trnyclass}) Verified a ${time} for ${userMention(player_id)}
on ${map}
${subtext(`time ID: ${time_id}`)}

${subtext(`verified: this time was slower than Tempus PR`)}`);
  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('verify a player\'s tourney time')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option.setName('time_id')
        .setDescription('from the submitted time\'s message')
        .setMinValue(1)
        .setMaxValue(999999)
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); // thinking...
    const time_id = interaction.options.getInteger('time_id');
    const time = getTime(time_id);
    if (time) {
      const player = getPlayerByID(time.player_id);
      const trny = getTourney(time.tournament_id);
      const division = trny.class === 'Soldier' ? player.soldier_division : player.demo_division;
      verifyTourneyTime(time_id);
      interaction.editReply({ embeds: [getForceVerifiedEmbed(player.id, formatTime(time.run_time), time_id, trny.class, getTourneyMap(trny, division))] });
      updateSheetTimes(trny);
    }
    else {
      interaction.editReply(`❌ Couldn't find a time to verify.`);
    }
  },
};