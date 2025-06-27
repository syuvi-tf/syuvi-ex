const { SlashCommandBuilder } = require('discord.js');
const { getPlayer, createPlayer } = require('../../lib/database.js');
const { getPlayerEmbed } = require('../../lib/components.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('view a player\'s profile')
    .addUserOption(option =>
      option.setName('player')
        .setDescription('@user')),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const user = interaction.options.getUser('player') ?? interaction.user;
    const player = getPlayer(user.id) ?? createPlayer(user.id, user.displayName);

    interaction.editReply({ embeds: [getPlayerEmbed(user, player)] });
  },
};