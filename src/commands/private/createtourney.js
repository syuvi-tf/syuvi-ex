const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, channelMention, inlineCode, time, TimestampStyles } = require('discord.js');
const { createTourney } = require('../../lib/database.js');
const { createStartJob, createEndJob } = require('../../lib/schedules.js');
const { signupsChannelId, faqChannelId } = require('../../lib/guild-ids.js');
const { confirmRow, getMapSelectModal } = require('../../lib/components.js');

// get the initial signup embed
async function getSignupsEmbed(trny) {
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
    );
  if (trny.class === 'Soldier') {
    signupsEmbed.addFields({ name: 'Wood', value: '\u200b' });
  }
  signupsEmbed.addFields({ name: 'No Division', value: '\u200b' });
  return signupsEmbed;
}

// wait for tourney confirmation
async function tryConfirm(tourneyResponse, trny, interaction) {
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
      const tourneyCreated = createTourney(trny);
      if (tourneyCreated) {
        // then send #signups message
        const signupsMessage = await signupsChannel.send({ embeds: [await getSignupsEmbed(trny)] });
        signupsMessage.react(`✅`);
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
        .setDescription('tourney start day')
        .setMinValue(1)
        .setMaxValue(31)
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('year')
        .setDescription('tourney start year')
        .setMinValue(2025)
        .setMaxValue(2050)
        .setRequired(true)),
  async execute(interaction) {
    const tourneyClass = interaction.options.getString('class');
    const month = interaction.options.getString('month');
    const dayOption = interaction.options.getInteger('day');
    const day = dayOption < 10 ? '0' + dayOption : dayOption;
    const endDay = dayOption + 2 < 10 ? '0' + (dayOption + 2) : dayOption + 2;
    const year = interaction.options.getInteger('year');
    const datetime = `${year}-${month}-${day} 00:00:00`;
    const endDatetime = `${year}-${month}-${endDay} 00:00:00`;
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