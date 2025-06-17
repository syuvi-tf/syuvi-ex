const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('echo the last message sent in this channel, to another channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('#channel to relay the last message to')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const channel = interaction.options.getChannel('channel');
    try {
      const echoMessage = (await interaction.channel.messages.fetch({ limit: 2, cache: false })).filter((message) => !message.author.bot).values().next().value;
      channel.send({ content: echoMessage.content });
      interaction.editReply(`✅ Message relayed.`);
    }
    catch {
      interaction.editReply(`❌ Ran into an error.. couldn't relay message.`);
    }
  },
};