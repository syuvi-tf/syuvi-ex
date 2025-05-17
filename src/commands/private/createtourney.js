const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ModalBuilder, EmbedBuilder, TextInputBuilder, TextInputStyle, channelMention, inlineCode, time, TimestampStyles } = require('discord.js');
const { createStartJob, createEndJob } = require('../../lib/tourney-schedule.js');
const { createTournament } = require('../../lib/database.js');
const { signupsChannelId, faqChannelId } = require('../../lib/guild-specific.js');
const { confirmRow } = require('../../lib/components.js');

// returns the initial signup embed
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
    const response = await tourneyResponse.resource.message.awaitMessageComponent({ filter, time: 30_000 });
    if (response.customId === 'confirm') {
      const signupsMessage = await signupsChannel.send({ embeds: [await getSignupsEmbed(trny)] });
      signupsMessage.react(`✅`);
      createTournament(signupsMessage.id, trny);
      createStartJob(trny.starts_at);
      createEndJob(trny.ends_at);
      await response.update({
        components: []
      });
      await channel.send(`✅ tournament confirmed.`);
    }
    else if (response.customId === 'cancel') {
      await response.update({
        components: []
      });
      await channel.send(`❌ canceled command.`);
    }
  }
  catch (error) {
    console.error;
    console.log("encountered an error during /createtourney tryConfirm()");
    await tourneyResponse.resource.message.edit({
      content: `❌ timed out after 30 seconds or ran into an error.. canceled command.`,
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
    const tourneyclass = interaction.options.getString('class');
    const month = interaction.options.getString('month');
    const day_option = interaction.options.getInteger('day');
    const day = day_option < 10 ? '0' + day_option : day_option;
    const end_day = day_option + 2 < 10 ? '0' + day_option + 2 : day_option + 2;
    const year = interaction.options.getInteger('year');
    const datetime = `${year}-${month}-${day} 00:00:00`;
    const end_datetime = `${year}-${month}-${end_day} 00:00:00`;
    const discord_timestamp = time(new Date(datetime));

    // build "pop-up form" modal
    const modal = new ModalBuilder()
      .setCustomId('mapSelect')
      .setTitle(`${tourneyclass} Tourney Maps`);
    const platGoldMap = new TextInputBuilder()
      .setCustomId('plat_gold_map')
      .setLabel('Platinum / Gold Map')
      .setStyle(TextInputStyle.Short);
    const silverMap = new TextInputBuilder()
      .setCustomId('silver_map')
      .setLabel('Silver Map')
      .setStyle(TextInputStyle.Short);
    const bronzeMap = new TextInputBuilder()
      .setCustomId('bronze_map')
      .setLabel('Bronze Map')
      .setStyle(TextInputStyle.Short);
    const steelMap = new TextInputBuilder()
      .setCustomId('steel_map')
      .setLabel('Steel Map')
      .setStyle(TextInputStyle.Short);
    const woodMap = new TextInputBuilder()
      .setCustomId('wood_map')
      .setLabel('Wood Map')
      .setStyle(TextInputStyle.Short);

    // these divisions apply to both soldier and demo 
    const defaultMapRows = new ActionRowBuilder().addComponents(platGoldMap, silverMap, bronzeMap, steelMap, woodMap);
    const woodMapRow = new ActionRowBuilder().addComponents(woodMap);
    modal.addComponents(defaultMapRows);
    if (tourneyclass === 'Soldier') {
      modal.addComponents(woodMapRow); // wood only applies to soldier
    }

    // waiting...
    const channel = await interaction.channel;
    const waitMessage = await channel.send(`⌛ waiting for ${interaction.user.displayName} to select maps..`);

    await interaction.showModal(modal);

    // wait for maps to be selected
    try {
      const modalFilter = (i) => i.customId === 'mapSelect';
      const submittedMapResponse = await interaction.awaitModalSubmit({ filter: modalFilter, time: 120_000 });
      const submittedMapFields = submittedMapResponse.fields;
      const submittedTourney = {
        class: tourneyclass,
        plat_gold: submittedMapFields.getTextInputValue('plat_gold_map'),
        silver: submittedMapFields.getTextInputValue('silver_map'),
        bronze: submittedMapFields.getTextInputValue('bronze_map'),
        steel: submittedMapFields.getTextInputValue('steel_map'),
        wood: tourneyclass === 'Soldier' ? submittedMapFields.getTextInputValue('wood_map') : undefined,
        starts_at: datetime,
        ends_at: end_datetime
      }

      // delete the "waiting for user" message after receiving the modal submission
      waitMessage.delete();

      // tourney confirmation message
      const tourneyResponse = await submittedMapResponse.reply({
        content: (`${tourneyclass} tournament start date set to ${discord_timestamp}
Platinum / Gold Map: ${inlineCode(submittedTourney.plat_gold)}
Silver Map: ${inlineCode(submittedTourney.silver)}
Bronze Map: ${inlineCode(submittedTourney.bronze)}
Steel Map: ${inlineCode(submittedTourney.steel)}
${tourneyclass === 'Soldier' ? `Wood Map: ${inlineCode(submittedTourney.wood)}` : ``}`),
        components: [confirmRow],
        withResponse: true,
      });
      tryConfirm(tourneyResponse, submittedTourney, interaction);
    }
    catch (error) {
      console.error;
      console.log("encountered an error during /createtourney");
      const timeoutMessage = await channel.send(`❌ timed out after 120 seconds or ran into an error..canceled command.`);
      setTimeout(() => { timeoutMessage.delete(), waitMessage.delete() }, 10_000);
    }
  },
};