const { SlashCommandBuilder, inlineCode } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('latency test'),
  async execute(interaction) {
    const sentMessage = await interaction.deferReply(); //thinking...
    interaction.editReply(`pong! ${inlineCode(sentMessage.createdTimestamp - interaction.createdTimestamp + 'ms')}`);
  },
};