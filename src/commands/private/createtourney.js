import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  channelMention,
  userMention,
  inlineCode,
  time,
  TimestampStyles,
  ChatInputCommandInteraction,
  InteractionCallbackResponse,
  ButtonInteraction,
} from "discord.js";
import { createTourney, getActiveTourney } from "../../lib/database.js";
import { startTourneyJob, endTourneyJob, updateSignupsJob } from "../../lib/schedules.js";
import { signupsChannelId, faqChannelId, divisionRoleIds } from "../../lib/guild-ids.js";
import { confirmRow, getMapSelectModal } from "../../lib/components.js";

function getSignupEmbed(tourney) {
  const starts_at = time(new Date(tourney.starts_at), TimestampStyles.LongDateTime);
  const ends_at = time(new Date(tourney.ends_at), TimestampStyles.ShortDateTime);
  const relative_starts_at = time(new Date(tourney.starts_at), TimestampStyles.RelativeTime);

  const signupsEmbed = new EmbedBuilder()
    .setColor("A69ED7")
    .setTitle(`${tourney.class} Tournament`)
    .setDescription(
      `Signups are open for a tournament! See ${channelMention(faqChannelId)} for more info.

⌛ ${starts_at} - ${ends_at}
starts ${relative_starts_at}
\u200b`,
    )
    .setFooter({ text: "updates every minute" });

  return signupsEmbed;
}

/**
 * Creates a series of embeds - an initial announcement embed and an embed per division.
 * There is a small character limit per embed and embed field, we avoid it by creating
 * an embed per division
 * @param {Tournament} tourney
 * @returns {EmbedBuilder[]} an array of the initial signup embeds for the tournament
 */
function getDivisionEmbeds(tourney, roles) {
  const divisions = ["Platinum", "Gold", "Silver", "Bronze", "Steel"];
  if (tourney.class === "Soldier") {
    divisions.push("Wood");
  }

  divisions.push("No Division");

  const embeds = [];
  for (const division of divisions) {
    const color = roles.get(
      divisionRoleIds.get(`${division} ${tourney.class}`),
    )?.color ?? 'A69ED7';
    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({ name: division })
      .setDescription("\u200b");

    embeds.push(embed);
  }

  return embeds;
}

/**
 *
 * @param {ButtonInteraction} confirmResponse
 * @param {Tournament} submitted_tourney
 * @param {ChatInputCommandInteraction} interaction
 * @returns
 */
async function handleConfirm(confirmResponse, submitted_tourney, interaction) {
  const signupsChannel = await interaction.guild.channels.cache.get(signupsChannelId);

  await confirmResponse.update({
    // remove confirm row
    components: [],
  });

  // create tourney in the database if there are none active
  const tourneyCreated = createTourney(submitted_tourney);
  if (!tourneyCreated) {
    await interaction.channel.send(
      `❌ Couldn't create this tournament. Is there already one upcoming / active?`,
    );
    return;
  }

  // get the tourney that was just created
  const tourney = getActiveTourney();

  // start jobs for it
  startTourneyJob(tourney.starts_at, interaction.guild.channels.cache);
  endTourneyJob(tourney.ends_at, interaction.guild.channels.cache, tourney);

  // then send #signup initial signup message & division messages
  const divisionEmbeds = getDivisionEmbeds(tourney, interaction.guild.roles.cache);
  const signupMessage = await signupsChannel.send({ embeds: [getSignupEmbed(tourney)] });
  await signupMessage.react(`✅`);

  for (const divisionEmbed of divisionEmbeds) {
    await signupsChannel.send({ embeds: [divisionEmbed] });
  }

  // run this job after #signup message sends
  updateSignupsJob(signupsChannel);
  await interaction.channel.send(`✅ Tournament confirmed. Please be aware not to send any other messages in the signups channel.`);
}

// wait for tourney confirmation
/**
 *
 * @param {InteractionCallbackResponse} tourneyResponse
 * @param {Tournament} submitted_tourney
 * @param {ChatInputCommandInteraction} interaction
 */
async function tryConfirm(tourneyResponse, submitted_tourney, interaction) {
  const filter = (i) => i.user.id === interaction.user.id;

  try {
    const confirmResponse = await tourneyResponse.resource.message.awaitMessageComponent({
      filter,
      time: 30_000,
    });
    switch (confirmResponse.customId) {
      case "cancel":
        await confirmResponse.update({
          // remove confirm row
          components: [],
        });

        await interaction.channel.send(`❌ Canceled command.`);
        break;
      case "confirm":
        await handleConfirm(confirmResponse, submitted_tourney, interaction);
        break;
      default:
        console.log(`ERROR: unexpected confirmResponse.customId '${confirmResponse.customId}'`);
        break;
    }
  } catch (error) {
    console.log(error);
    console.log("/createtourney tryConfirm() error");

    await tourneyResponse.resource.message.edit({
      content: `❌ Timed out after 30 seconds or ran into an error.. canceled command.`,
      components: [],
    });
  }
}

const command = new SlashCommandBuilder()
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
  );

class Tournament {
  /**
   *
   * @param {string} tourneyClass
   * @param {string} platGoldMap
   * @param {string} silverMap
   * @param {string} bronzeMap
   * @param {string} steelMap
   * @param {string} woodMap
   * @param {string} startsAt
   * @param {string} endsAt
   */
  constructor(
    tourneyClass,
    platGoldMap,
    silverMap,
    bronzeMap,
    steelMap,
    woodMap,
    startsAt,
    endsAt,
  ) {
    this.class = tourneyClass;
    this.plat_gold = platGoldMap;
    this.silver = silverMap;
    this.bronze = bronzeMap;
    this.steel = steelMap;
    this.wood = woodMap;
    this.starts_at = startsAt;
    this.ends_at = endsAt;
  }
}

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */
async function executeCommand(interaction) {
  const tourneyClass = interaction.options.getString("class");
  const month = interaction.options.getString("month");
  const dayOption = interaction.options.getInteger("day");
  const day = dayOption < 10 ? "0" + dayOption : dayOption;
  const offsetHoursOption = interaction.options.getInteger("offset") ?? 0;
  const offsetHours = offsetHoursOption < 10 ? "0" + offsetHoursOption : offsetHoursOption;
  const now = new Date(new Date().toUTCString());

  let year = now.getUTCFullYear();

  // if the current date is ahead of the set tourney date, add a year
  if (now > new Date(`${year}-${month}-${day}T${offsetHours}:00:00Z`)) {
    year += 1;
  }

  const datetime = `${year}-${month}-${day}T${offsetHours}:00:00Z`;
  const endDate = new Date(datetime);
  endDate.setDate(endDate.getDate() + 2);

  const endDatetime = endDate.toISOString();
  const discordTimestamp = time(new Date(datetime));
  const channel = await interaction.channel;

  // show map select modal
  await interaction.showModal(getMapSelectModal(tourneyClass));

  // wait for maps to be selected
  const waitMessage = await channel.send({
    content: `⌛ Waiting (2 min) for ${userMention(interaction.user.id)} to select maps..`,
    allowedMentions: { users: [] },
  });

  try {
    const modalFilter = (i) => i.customId === "mapSelect";
    const submittedMapResponse = await interaction.awaitModalSubmit({
      filter: modalFilter,
      time: 120_000,
    });

    const submittedMapFields = submittedMapResponse.fields;
    const submittedTourney = new Tournament(
      tourneyClass,
      submittedMapFields.getTextInputValue("plat_gold_map"),
      submittedMapFields.getTextInputValue("silver_map"),
      submittedMapFields.getTextInputValue("bronze_map"),
      submittedMapFields.getTextInputValue("steel_map"),
      tourneyClass === "Soldier" ? submittedMapFields.getTextInputValue("wood_map") : null,
      datetime,
      endDatetime,
    );

    // delete the "waiting for user" message after receiving the modal submission
    waitMessage.delete();

    // tourney confirmation message
    const tourneyResponse = await submittedMapResponse.reply({
      content: `${tourneyClass} tournament start date set to ${discordTimestamp}
Platinum / Gold Map: ${inlineCode(submittedTourney.plat_gold)}
Silver Map: ${inlineCode(submittedTourney.silver)}
Bronze Map: ${inlineCode(submittedTourney.bronze)}
Steel Map: ${inlineCode(submittedTourney.steel)}
${tourneyClass === "Soldier" ? `Wood Map: ${inlineCode(submittedTourney.wood)}` : ``}`,
      components: [confirmRow],
      withResponse: true,
    });

    tryConfirm(tourneyResponse, submittedTourney, interaction);
  } catch (error) {
    console.log(error);
    console.log("/createtourney error");

    const timeoutMessage = await channel.send(
      `❌ Timed out after 2 minutes or ran into an error.. canceled command.`,
    );

    // delete messages not tied to command
    setTimeout(() => {
      (timeoutMessage.delete(), waitMessage.delete());
    }, 10_000);
  }
}

export default {
  data: command,
  execute: executeCommand,
};
