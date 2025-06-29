import { SlashCommandBuilder } from "discord.js";
import {
  getPlayer,
  createPlayer,
  getOngoingTourney,
  getRecentTourney,
} from "../../lib/database.js";
import { getTourneyTopTimesEmbed } from "../../lib/components.js";

export default {
  data: new SlashCommandBuilder()
    .setName("toptimes")
    .setDescription("display the top 8 times for the current / previous tourney")
    .addStringOption((option) =>
      option
        .setName("division")
        .setDescription("division top times to display")
        .addChoices(
          { name: "Platinum", value: "Platinum" },
          { name: "Gold", value: "Gold" },
          { name: "Silver", value: "Silver" },
          { name: "Bronze", value: "Bronze" },
          { name: "Steel", value: "Steel" },
          { name: "Wood", value: "Wood" },
        ),
    ),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const tourney = getOngoingTourney() ?? getRecentTourney();
    const member = interaction.member;
    const division_name = interaction.options.getString("division") ?? null;
    if (!tourney) {
      interaction.editReply(`Couldn't find a tourney to display a leaderboard for..`);
    } else {
      if (!division_name) {
        // no division name, use player's div if they have one
        const player = getPlayer(member.id) ?? createPlayer(member.id, member.displayName);
        const player_division_name =
          tourney.class === "Soldier" ? player.soldier_division : player.demo_division;
        if (player_division_name) {
          // embed leaderboard for player's division
          interaction.editReply({
            embeds: [
              getTourneyTopTimesEmbed(tourney, player_division_name, interaction.guild.roles),
            ],
          });
        } else {
          interaction.editReply(
            `Couldn't display a leaderboard, as you don't have a ${tourney.class} division.`,
          );
        }
      } else {
        // run normally
        if (tourney.class === "Demo" && division_name === "Wood") {
          interaction.editReply("There is no Wood Demo leaderboard..");
        } else {
          // embed for selected division
          interaction.editReply({
            embeds: [getTourneyTopTimesEmbed(tourney, division_name, interaction.guild.roles)],
          });
        }
      }
    }
  },
};
