import { SlashCommandBuilder, PermissionFlagsBits, userMention } from "discord.js"
import { getPlayerByID, getTourney, removeTourneyTime, getTime } from "../../lib/database.js"
import { formatTime } from "../../lib/shared-functions.js"
import { updateSheetTimes } from "../../lib/sheet.js"

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removetime")
    .setDescription("remove a player's time")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption((option) =>
      option
        .setName("time_id")
        .setDescription("from the submitted time's message")
        .setMinValue(1)
        .setMaxValue(999999)
        .setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply() //thinking...
    const time_id = interaction.options.getInteger("time_id")
    const time = getTime(time_id)
    if (time) {
      const trny = getTourney(time.tournament_id)
      const player = getPlayerByID(time.player_id)
      removeTourneyTime(time_id)
      interaction.editReply({
        content: `✅ Removed a ${formatTime(time.run_time, true)} for ${userMention(player.discord_id)}`,
        allowedMentions: { users: [] },
      })
      updateSheetTimes(trny)
    } else {
      interaction.editReply(`❌ Couldn't find a time to remove.`)
    }
  },
}
