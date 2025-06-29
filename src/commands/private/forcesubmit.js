import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  userMention,
  subtext,
  EmbedBuilder,
} from "discord.js";
import {
  getPlayer,
  createPlayer,
  getRecentTourney,
  getTourneyPlayer,
  createTourneyTime,
  getOngoingTourney,
} from "../../lib/database.js";
import { getTourneyMap, isValidTime, getTimeSectionsArray } from "../../lib/shared-functions.js";
import { updateSheetTimes } from "../../lib/sheet.js";

function getForceSubmitEmbed(player_id, time, time_id, trnyclass, map) {
  const embed = new EmbedBuilder().setColor("A69ED7")
    .setDescription(`TF2PJ | (${trnyclass}) Force submitted a ${time} for ${userMention(player_id)}
on ${map}
${subtext(`time ID: ${time_id}`)}

${subtext(`force submitted: this time skipped PR checks.`)}`);
  return embed;
}

export default {
  data: new SlashCommandBuilder()
    .setName("forcesubmit")
    .setDescription("force submit a time for a player")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((option) => option.setName("player").setDescription("@user").setRequired(true))
    .addStringOption((option) =>
      option.setName("time").setDescription("format: MM:SS.ss").setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const user = interaction.options.getUser("player");
    const time = interaction.options.getString("time");
    const player = getPlayer(user.id) ?? createPlayer(user.id, user.displayName);
    const trny = getOngoingTourney() ?? getRecentTourney();

    if (!isValidTime(time)) {
      await interaction.editReply({
        content: `Couldn't force submit this time, as it's not in the expected format.
${subtext(`format: MM:SS.ss / SS.ss`)}`,
      });
    } else {
      if (!trny) {
        interaction.editReply(
          `❌ Couldn't manually submit this time, as there's no ongoing or recent tourney.`,
        );
      } else {
        const division = trny.class === "Soldier" ? player.soldier_division : player.demo_division;
        if (
          !division ||
          !getTourneyPlayer(trny.id, player.id) ||
          getTourneyPlayer(trny.id, player.id).signed_up === 0
        ) {
          interaction.editReply(
            `❌ Couldn't manually submit this time, as this player is missing a division or wasn't signed up.`,
          );
        } else {
          const timeSections = getTimeSectionsArray(time);
          const timeSeconds =
            timeSections.length === 2
              ? parseFloat(time) //SS.ss
              : parseFloat(
                  `${parseInt(timeSections[0]) * 60 + parseInt(timeSections[1])}.${timeSections[2]}`,
                );
          const time_id = createTourneyTime(trny.id, player.id, timeSeconds, true);
          interaction.editReply({
            embeds: [
              getForceSubmitEmbed(
                player.discord_id,
                time,
                time_id,
                trny.class,
                getTourneyMap(trny, division),
              ),
            ],
          });
          updateSheetTimes(trny);
        }
      }
    }
  },
};
