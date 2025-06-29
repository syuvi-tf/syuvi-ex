import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  channelMention,
  userMention,
  inlineCode,
  time,
  TimestampStyles,
} from "discord.js"
import { createTourney, getActiveTourney } from "../../lib/database.js"
import { startTourneyJob, endTourneyJob, updateSignupsJob } from "../../lib/schedules.js"
import { signupsChannelId, faqChannelId } from "../../lib/guild-ids.js"
import { confirmRow, getMapSelectModal } from "../../lib/components.js"

// get the initial signup embed
function getSignupsEmbed(trny) {
  // get tourney we just wrote to the database
  const starts_at = time(new Date(trny.starts_at), TimestampStyles.LongDateTime)
  const ends_at = time(new Date(trny.ends_at), TimestampStyles.ShortDateTime)
  const relative_starts_at = time(new Date(trny.starts_at), TimestampStyles.RelativeTime)
  const signupsEmbed = new EmbedBuilder()
    .setColor("A69ED7")
    .setTitle(`${trny.class} Tournament`)
    .setDescription(
      `Signups are open for a tournament! See ${channelMention(faqChannelId)} for more info.
    
⌛ ${starts_at} - ${ends_at}
starts ${relative_starts_at}
\u200b`,
    )
    .addFields(
      { name: "Platinum", value: "\u200b" },
      { name: "Gold", value: "\u200b" },
      { name: "Silver", value: "\u200b" },
      { name: "Bronze", value: "\u200b" },
      { name: "Steel", value: "\u200b" },
    )
    .setFooter({ text: "updates every minute" })
  if (trny.class === "Soldier") {
    signupsEmbed.addFields({ name: "Wood", value: "\u200b" })
  }
  signupsEmbed.addFields({ name: "No Division", value: "\u200b" })
  return signupsEmbed
}

// wait for tourney confirmation
async function tryConfirm(tourneyResponse, submitted_trny, interaction) {
  const channel = interaction.channel
  const signupsChannel = await interaction.guild.channels.cache.get(signupsChannelId)
  const filter = (i) => i.user.id === interaction.user.id

  try {
    const confirmResponse = await tourneyResponse.resource.message.awaitMessageComponent({
      filter,
      time: 30_000,
    })
    if (confirmResponse.customId === "confirm") {
      await confirmResponse.update({
        // remove confirm row
        components: [],
      })
      // create tourney in the database if there are none active
      const tourneyCreated = createTourney(submitted_trny)
      if (tourneyCreated) {
        // get the tourney that was just created
        const trny = getActiveTourney()
        // start jobs for it
        startTourneyJob(trny.starts_at, interaction.guild.channels.cache)
        endTourneyJob(trny.ends_at, interaction.guild.channels.cache, trny)
        // then send #signup message
        const signupsMessage = await signupsChannel.send({ embeds: [getSignupsEmbed(trny)] })
        await signupsMessage.react(`✅`)
        // run this job after #signup message sends
        updateSignupsJob(signupsChannel)
        await channel.send(`✅ Tournament confirmed.`)
      } else {
        await channel.send(
          `❌ Couldn't create this tournament. Is there already one upcoming / active?`,
        )
      }
    } else if (confirmResponse.customId === "cancel") {
      await confirmResponse.update({
        // remove confirm row
        components: [],
      })
      await channel.send(`❌ Canceled command.`)
    }
  } catch {
    console.log("/createtourney tryConfirm() error")
    await tourneyResponse.resource.message.edit({
      content: `❌ Timed out after 30 seconds or ran into an error.. canceled command.`,
      components: [],
    })
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createtourney")
    .setDescription("create and open signups for a new tournament")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("class")
        .setDescription("tournament class")
        .setRequired(true)
        .addChoices({ name: "Soldier", value: "Soldier" }, { name: "Demo", value: "Demo" }),
    )
    .addStringOption((option) =>
      option
        .setName("month")
        .setDescription("tournament start month")
        .setRequired(true)
        .addChoices(
          { name: "January", value: "01" },
          { name: "February", value: "02" },
          { name: "April", value: "04" },
          { name: "May", value: "05" },
          { name: "June", value: "06" },
          { name: "July", value: "07" },
          { name: "August", value: "08" },
          { name: "September", value: "09" },
          { name: "October", value: "10" },
          { name: "November", value: "11" },
          { name: "December", value: "12" },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("day")
        .setDescription("tourney start day (midnight UTC)")
        .setMinValue(1)
        .setMaxValue(31)
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("offset")
        .setDescription("positive offset in hours from UTC midnight (start of day)")
        .setMinValue(1)
        .setMaxValue(23),
    ),
  async execute(interaction) {
    const trny_class = interaction.options.getString("class")
    const month = interaction.options.getString("month")
    const dayOption = interaction.options.getInteger("day")
    const offsetHoursOption = interaction.options.getInteger("offset") ?? 0
    const offsetHours = offsetHoursOption < 10 ? "0" + offsetHoursOption : offsetHoursOption
    const now = new Date(new Date().toUTCString())

    const day = dayOption < 10 ? "0" + dayOption : dayOption
    let year = now.getUTCFullYear()
    // if the current date is ahead of the set tourney date, add a year
    if (now > new Date(`${year}-${month}-${day}T${offsetHours}:00:00Z`)) {
      year += 1
    }
    const datetime = `${year}-${month}-${day}T${offsetHours}:00:00Z`
    const endDate = new Date(datetime)
    endDate.setDate(endDate.getDate() + 2)
    const endDatetime = endDate.toISOString()
    const discordTimestamp = time(new Date(datetime))
    // waiting...
    const channel = await interaction.channel
    // show map select modal
    await interaction.showModal(getMapSelectModal(trny_class))
    // wait for maps to be selected
    const waitMessage = await channel.send({
      content: `⌛ Waiting (2 min) for ${userMention(interaction.user.id)} to select maps..`,
      allowedMentions: { users: [] },
    })
    try {
      const modalFilter = (i) => i.customId === "mapSelect"
      const submittedMapResponse = await interaction.awaitModalSubmit({
        filter: modalFilter,
        time: 120_000,
      })
      const submittedMapFields = submittedMapResponse.fields
      const submittedTourney = {
        class: trny_class,
        plat_gold: submittedMapFields.getTextInputValue("plat_gold_map"),
        silver: submittedMapFields.getTextInputValue("silver_map"),
        bronze: submittedMapFields.getTextInputValue("bronze_map"),
        steel: submittedMapFields.getTextInputValue("steel_map"),
        wood: trny_class === "Soldier" ? submittedMapFields.getTextInputValue("wood_map") : null,
        starts_at: datetime,
        ends_at: endDatetime,
      }
      // delete the "waiting for user" message after receiving the modal submission
      waitMessage.delete()
      // tourney confirmation message
      const tourneyResponse = await submittedMapResponse.reply({
        content: `${trny_class} tournament start date set to ${discordTimestamp}
Platinum / Gold Map: ${inlineCode(submittedTourney.plat_gold)}
Silver Map: ${inlineCode(submittedTourney.silver)}
Bronze Map: ${inlineCode(submittedTourney.bronze)}
Steel Map: ${inlineCode(submittedTourney.steel)}
${trny_class === "Soldier" ? `Wood Map: ${inlineCode(submittedTourney.wood)}` : ``}`,
        components: [confirmRow],
        withResponse: true,
      })
      tryConfirm(tourneyResponse, submittedTourney, interaction)
    } catch (error) {
      console.log(error)
      console.log("/createtourney error")
      const timeoutMessage = await channel.send(
        `❌ Timed out after 2 minutes or ran into an error.. canceled command.`,
      )
      // delete messages not tied to command
      setTimeout(() => {
        ;(timeoutMessage.delete(), waitMessage.delete())
      }, 10_000)
    }
  },
}
