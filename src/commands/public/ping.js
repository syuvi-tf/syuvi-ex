const { SlashCommandBuilder, inlineCode } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('latency test'),
  async execute(interaction) {
    const sent = await interaction.deferReply(); //thinking...
    interaction.reply(`pong! ${inlineCode(sent.createdTimestamp - interaction.createdTimestamp + 'ms')}`);
  },
};