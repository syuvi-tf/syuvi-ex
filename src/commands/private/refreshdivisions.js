const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { setDivisionsFromRoles } = require('../../lib/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refreshdivisions')
    .setDescription('refresh divisions for every player')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const confirm = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('confirm')
      .setStyle(ButtonStyle.Success);
    const cancel = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('cancel')
      .setStyle(ButtonStyle.Secondary);
    const confirmRow = new ActionRowBuilder()
      .addComponents(confirm, cancel);

    const response = await interaction.reply({
      content: 'this will update the divisions of every player according to their discord roles,  ' +
        'this command may be expensive, so please only use it when necessary!',
      components: [confirmRow],
      withResponse: true,
    });

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
      const confirmResponse = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 30_000 });
      if (confirmResponse.customId === 'confirm') {
        setDivisionsFromRoles(interaction.guild.members.cache);
        await confirmResponse.update({
          content: `updated divisions`,
          components: []
        });
      }
      else if (confirmResponse.customId === 'cancel') {
        await confirmResponse.update({
          content: `canceled command.`,
          components: []
        });
      }
    } catch {
      await interaction.editReply({
        content: `timed out or ran into an error.. canceled command.`,
        components: []
      });
    }
  },
};