const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateAllPlayerDivisions } = require('../../lib/database.js');
const { confirmRow } = require('../../lib/components.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refreshdivisions')
    .setDescription('refresh divisions for every player')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const response = await interaction.reply({
      content: `This command updates the divisions of every player according to their discord roles. Are you sure?`,
      components: [confirmRow],
      withResponse: true,
    });

    try {
      const filter = (i) => i.user.id === interaction.user.id;
      const confirmResponse = await response.resource.message.awaitMessageComponent({ filter, time: 30_000 });
      if (confirmResponse.customId === 'confirm') {
        const numUpdated = updateAllPlayerDivisions(await interaction.guild.members.fetch());
        await confirmResponse.update({
          content: `✅ Updated divisions for ${numUpdated} roles.`,
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