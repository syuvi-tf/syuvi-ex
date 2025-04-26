const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('latency test'),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    interaction.editReply(`pong! (in ${sent.createdTimestamp - interaction.createdTimestamp}ms)`);
  },
};