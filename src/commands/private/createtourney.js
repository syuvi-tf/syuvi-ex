const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, inlineCode, time } = require('discord.js');
const { createStartJob, createEndJob } = require('../../lib/tourney-schedule.js');
const { signupsChannelId } = require('../../lib/guild-specific.js');
const { confirmRow } = require('../../lib/components.js');

async function tryConfirm(tourneyResponse, interaction) {
  const channel = interaction.channel;
  const signupsChannel = interaction.guild.channels.cache.get(signupsChannelId);
  const filter = (i) => i.user.id === interaction.user.id;
  try {
    const response = await tourneyResponse.resource.message.awaitMessageComponent({ filter, time: 30_000 });
    if (response.customId === 'confirm') {
      signupsChannel.send('signup stuff'); // send in #signups
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
    console.log(error);
    await tourneyResponse.resource.message.edit({
      content: `❌ timed out after 30 seconds or ran into an error..canceled command.`,
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
    const year = interaction.options.getInteger('year');
    const datetime = `${year}-${month}-${day} 00:00:00`;
    const date = new Date(datetime);
    const discord_timestamp = time(date);
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
    const platGoldMapRow = new ActionRowBuilder().addComponents(platGoldMap);
    const silverMapRow = new ActionRowBuilder().addComponents(silverMap);
    const bronzeMapRow = new ActionRowBuilder().addComponents(bronzeMap);
    const steelMapRow = new ActionRowBuilder().addComponents(steelMap);
    const woodMapRow = new ActionRowBuilder().addComponents(woodMap);
    modal.addComponents(platGoldMapRow, silverMapRow, bronzeMapRow, steelMapRow);
    if (tourneyclass === 'Soldier') {
      modal.addComponents(woodMapRow);
    }

    // waiting...
    const channel = await interaction.channel;
    const waitMessage = await channel.send(`⌛ waiting for ${interaction.user.displayName} to select maps..`);

    await interaction.showModal(modal);
    try {
      const modalFilter = (i) => i.customId === 'mapSelect';
      const submittedMaps = await interaction.awaitModalSubmit({ filter: modalFilter, time: 10_000 });
      const submittedMapFields = submittedMaps.fields;
      const plat_gold_map = submittedMapFields.getTextInputValue('plat_gold_map');
      const silver_map = submittedMapFields.getTextInputValue('silver_map');
      const bronze_map = submittedMapFields.getTextInputValue('bronze_map');
      const steel_map = submittedMapFields.getTextInputValue('steel_map');
      let wood_map = undefined;
      if (tourneyclass === 'Soldier') {
        wood_map = submittedMapFields.getTextInputValue('wood_map');
      }
      // delete the "waiting for user" message after receiving the modal submission
      waitMessage.delete();

      // ask for tourney confirmation
      const tourneyResponse = await submittedMaps.reply({
        content: (`${tourneyclass} tournament start date set to ${discord_timestamp}
🟦 Platinum / Gold Map: ${inlineCode(plat_gold_map)}
⬜ Silver Map: ${inlineCode(silver_map)}
🟧 Bronze Map: ${inlineCode(bronze_map)}
⬛ Steel Map: ${inlineCode(steel_map)}
${tourneyclass === 'Soldier' ? `🟫 Wood Map: ${inlineCode(wood_map)}` : ``}`),
        components: [confirmRow],
        withResponse: true,
      });
      tryConfirm(tourneyResponse, interaction);
    }
    catch (error) {
      console.log(error);
      const timeoutMessage = await channel.send(`❌ timed out after 120 seconds or ran into an error..canceled command.`);
      setTimeout(() => { timeoutMessage.delete(), waitMessage.delete() }, 10_000);
    }
  },
};