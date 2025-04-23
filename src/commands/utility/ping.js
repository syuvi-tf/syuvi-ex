const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('latency test'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'ping...' });
    interaction.editReply(`pong! (in ${sent.createdTimestamp - interaction.createdTimestamp}ms)`);
  },
};