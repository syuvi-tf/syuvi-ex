const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, time, TextInputBuilder, TextInputStyle, ModalBuilder } = require('discord.js');
const { createStartJob, createEndJob } = require('../../lib/tourney-schedule.js');

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
      .setTitle(`${tourneyclass === 'Soldier' ? 'Soldier' : 'Demo'} Tourney Maps`);

    const platMap = new TextInputBuilder()
      .setCustomId('plat_map')
      .setLabel('Platinum Map')
      .setStyle(TextInputStyle.Short);
    const goldMap = new TextInputBuilder()
      .setCustomId('gold_map')
      .setLabel('Gold Map')
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

    const platMapRow = new ActionRowBuilder().addComponents(platMap);
    const goldMapRow = new ActionRowBuilder().addComponents(goldMap);
    const silverMapRow = new ActionRowBuilder().addComponents(silverMap);
    const bronzeMapRow = new ActionRowBuilder().addComponents(bronzeMap);
    const steelMapRow = new ActionRowBuilder().addComponents(steelMap);
    // const woodMapRow = new ActionRowBuilder().addComponents(woodMap);

    modal.addComponents(platMapRow, goldMapRow, silverMapRow, bronzeMapRow, steelMapRow);
    if (tourneyclass === 'Soldier') {
      // modal.addComponents(woodMapRow);
    }

    const channel = await interaction.channel;
    const response = await channel.send(`waiting for ${interaction.user.displayName} to select maps..`);

    await interaction.showModal(modal);
    try {
      const filter = (interaction) => interaction.customId === 'mapSelect';
      const submittedMaps = await interaction.awaitModalSubmit({ filter, time: 120_000 });
      console.log(submittedMaps.fields);
      response.delete();
      submittedMaps.reply(`submission successful. tournament start date set to ${discord_timestamp}`);
    } catch {
      await response.edit(`timed out after 120 seconds or ran into an error.. canceled command.`);
    }
  },
};