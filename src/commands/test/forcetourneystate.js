import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { forceStartTourney, forceEndTourney, getActiveTourney } from "../../lib/database.js";
import { startTourneyJob, endTourneyJob } from "../../lib/schedules.js";

export default {
  data: new SlashCommandBuilder()
    .setName("forcetourneystate")
    .setDescription("test")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("state")
        .setDescription("division top times to display")
        .addChoices({ name: "Start", value: "Start" }, { name: "End", value: "End" })
        .setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const trny = getActiveTourney();
    const state = interaction.options.getString("state");
    if (state === "Start") {
      forceStartTourney(trny.id);
      const newtrny = getActiveTourney();
      startTourneyJob(newtrny.starts_at, interaction.member.guild.channels.cache);
    } else {
      forceEndTourney(trny.id);
      const newtrny = getActiveTourney();
      endTourneyJob(newtrny.ends_at, interaction.member.guild.channels.cache, trny);
    }
    interaction.editReply("yeah tried to " + state + " it.");
  },
};
