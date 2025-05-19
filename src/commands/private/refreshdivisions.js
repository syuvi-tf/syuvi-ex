const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateAllPlayerDivisions } = require('../../lib/database.js');
const { confirmRow } = require('../../lib/components.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refreshdivisions')
    .setDescription('refresh divisions for every player')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const response = await interaction.reply({
      content: `This command updates the divisions of every player according to their discord roles. This might be expensive, so please only use it when necessary!`,
      components: [confirmRow],
      withResponse: true,
    });

    const filter = (i) => i.user.id === interaction.user.id;

    try {
      const confirmResponse = await response.resource.message.awaitMessageComponent({ filter, time: 30_000 });
      if (confirmResponse.customId === 'confirm') {
        updateAllPlayerDivisions(interaction.guild.members.cache);
        await confirmResponse.update({
          content: `✅ Updated divisions.`,
          components: []
        });
      }
      else if (confirmResponse.customId === 'cancel') {
        await confirmResponse.update({
          content: `❌ Canceled command.`,
          components: []
        });
      }
    }
    catch (error) {
      console.log(error);
      await interaction.editReply({
        content: `❌ Timed out after 30 seconds or ran into an error.. canceled command.`,
        components: []
      });
    }
  },
};