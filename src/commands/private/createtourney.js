//TODO: create start and end jobs when a tourney is created

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, channelMention, inlineCode, time, TimestampStyles } = require('discord.js');
const { createTourney, getActiveTourney } = require('../../lib/database.js');
const { startTourneyJob, endTourneyJob, updateSignupsJob } = require('../../lib/schedules.js');
const { signupsChannelId, faqChannelId } = require('../../lib/guild-ids.js');
const { confirmRow, getMapSelectModal } = require('../../lib/components.js');

// get the initial signup embed
async function getSignupsEmbed() {
  // get tourney we just wrote to the database
  const trny = getActiveTourney();
  const starts_at = time(new Date(trny.starts_at), TimestampStyles.LongDateTime);
  const ends_at = time(new Date(trny.ends_at), TimestampStyles.ShortDateTime);
  const relative_starts_at = time(new Date(trny.starts_at), TimestampStyles.RelativeTime);
  const signupsEmbed = new EmbedBuilder()
    .setColor('A69ED7')
    .setTitle(`${trny.class} Tournament`)
    .setDescription(`Signups are open for a tournament! See ${channelMention(faqChannelId)} for more info.
    
⌛ ${starts_at} - ${ends_at}
${relative_starts_at}
\u200b`)
    .addFields(
      { name: 'Platinum', value: '\u200b' },
      { name: 'Gold', value: '\u200b' },
      { name: 'Silver', value: '\u200b' },
      { name: 'Bronze', value: '\u200b' },
      { name: 'Steel', value: '\u200b' },
    )
    .setFooter({ text: 'signups update every 5 minutes' });
  if (trny.class === 'Soldier') {
    signupsEmbed.addFields({ name: 'Wood', value: '\u200b' });
  }
  signupsEmbed.addFields({ name: 'No Division', value: '\u200b' });
  return signupsEmbed;
}

// wait for tourney confirmation
async function tryConfirm(tourneyResponse, submitted_trny, interaction) {
  const channel = interaction.channel;
  const signupsChannel = interaction.guild.channels.cache.get(signupsChannelId);
  const filter = (i) => i.user.id === interaction.user.id;

  try {
    const confirmResponse = await tourneyResponse.resource.message.awaitMessageComponent({ filter, time: 30_000 });
    if (confirmResponse.customId === 'confirm') {
      await confirmResponse.update({ // remove confirm row
        components: []
      });
      // create tourney in the database if there are none active
      const tourneyCreated = createTourney(submitted_trny);
      if (tourneyCreated) {
        // then send #signups message
        const signupsMessage = await signupsChannel.send({ embeds: [await getSignupsEmbed()] });
        signupsMessage.react(`✅`);
        updateSignupsJob(signupsChannel);
        await channel.send(`✅ Tournament confirmed.`);
      }
      else {
        await channel.send(`❌ Couldn't create this tournament. Is there already one active?`);
      }
    }
    else if (confirmResponse.customId === 'cancel') {
      await confirmResponse.update({ // remove confirm row
        components: []
      });
      await channel.send(`❌ Canceled command.`);
    }
  }
  catch (error) {
    console.error;
    console.log("/createtourney tryConfirm() error");
    await tourneyResponse.resource.message.edit({
      content: `❌ Timed out after 30 seconds or ran into an error.. canceled command.`,
      components: []
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createtourney')
    .setDescription('create and open signups for a new tournament')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('class')
        .setDescription('tourney class')
        .setRequired(true)
        .addChoices(
          { name: 'Soldier', value: 'Soldier' },
          { name: 'Demo', value: 'Demo' },)
    )
    .addStringOption(option =>
      option.setName('month')
        .setDescription('tourney start month')
        .setRequired(true)
        .addChoices(
          { name: 'January', value: '01' },
          { name: 'February', value: '02' },
          { name: 'April', value: '04' },
          { name: 'May', value: '05' },
          { name: 'June', value: '06' },
          { name: 'July', value: '07' },
          { name: 'August', value: '08' },
          { name: 'September', value: '09' },
          { name: 'October', value: '10' },
          { name: 'November', value: '11' },
          { name: 'December', value: '12' },
        )
    )
    .addIntegerOption(option =>
      option.setName('day')
        .setDescription('tourney start day (midnight UTC)')
        .setMinValue(1)
        .setMaxValue(31)
        .setRequired(true)),
  async execute(interaction) {
    const tourneyClass = interaction.options.getString('class');
    const month = interaction.options.getString('month');
    const dayOption = interaction.options.getInteger('day');
    const day = dayOption < 10 ? '0' + dayOption : dayOption;
    const endDay = dayOption + 2 < 10 ? '0' + (dayOption + 2) : dayOption + 2;
    let year = new Date().getUTCFullYear();
    const currentDate = new Date(new Date().toUTCString());
    // if the current date is ahead of the set tourney date, add a year
    if (currentDate > new Date(`${year}-${month}-${day}T00:00:00Z`)) {
      year += 1;
    }
    const datetime = `${year}-${month}-${day}T00:00:00Z`;
    const endDatetime = `${year}-${month}-${endDay}T00:00:00Z`;
    const discordTimestamp = time(new Date(datetime));
    // waiting...
    const channel = await interaction.channel;
    const waitMessage = await channel.send(`⌛ Waiting for ${interaction.user.displayName} to select maps..`);
    // show map select modal
    await interaction.showModal(getMapSelectModal(tourneyClass));
    // wait for maps to be selected
    try {
      const modalFilter = (i) => i.customId === 'mapSelect';
      const submittedMapResponse = await interaction.awaitModalSubmit({ filter: modalFilter, time: 120_000 });
      const submittedMapFields = submittedMapResponse.fields;
      const submittedTourney = {
        class: tourneyClass,
        plat_gold: submittedMapFields.getTextInputValue('plat_gold_map'),
        silver: submittedMapFields.getTextInputValue('silver_map'),
        bronze: submittedMapFields.getTextInputValue('bronze_map'),
        steel: submittedMapFields.getTextInputValue('steel_map'),
        wood: tourneyClass === 'Soldier' ? submittedMapFields.getTextInputValue('wood_map') : undefined,
        starts_at: datetime,
        ends_at: endDatetime
      }
      // delete the "waiting for user" message after receiving the modal submission
      waitMessage.delete();
      // tourney confirmation message
      const tourneyResponse = await submittedMapResponse.reply({
        content: (`${tourneyClass} tournament start date set to ${discordTimestamp}
Platinum / Gold Map: ${inlineCode(submittedTourney.plat_gold)}
Silver Map: ${inlineCode(submittedTourney.silver)}
Bronze Map: ${inlineCode(submittedTourney.bronze)}
Steel Map: ${inlineCode(submittedTourney.steel)}
${tourneyClass === 'Soldier' ? `Wood Map: ${inlineCode(submittedTourney.wood)}` : ``}`),
        components: [confirmRow],
        withResponse: true,
      });
      tryConfirm(tourneyResponse, submittedTourney, interaction);
    }
    catch (error) {
      console.error;
      console.log("/createtourney error");
      const timeoutMessage = await channel.send(`❌ Timed out after 120 seconds or ran into an error..canceled command.`);
      // delete messages not tied to command
      setTimeout(() => { timeoutMessage.delete(), waitMessage.delete() }, 10_000);
    }
  },
};