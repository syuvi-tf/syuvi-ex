const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { setDivisionsFromRoles } = require('../../lib/database.js');
const { confirmRow } = require('../../lib/components.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refreshdivisions')
    .setDescription('refresh divisions for every player')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const response = await interaction.reply({
      content: `this will update the divisions of every player according to their discord roles.
this command may be expensive, so please only use it when necessary!`,
      components: [confirmRow],
      withResponse: true,
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;

    try {
      const confirmResponse = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 30_000 });
      if (confirmResponse.customId === 'confirm') {
        setDivisionsFromRoles(interaction.guild.members.cache);
        await confirmResponse.update({
          content: `✅ updated divisions.`,
          components: []
        });
      }
      else if (confirmResponse.customId === 'cancel') {
        await confirmResponse.update({
          content: `❌ canceled command.`,
          components: []
        });
      }
    }
    catch (error) {
      console.log(error);
      await interaction.editReply({
        content: `❌ timed out after 30 seconds or ran into an error.. canceled command.`,
        components: []
      });
    }
  },
};