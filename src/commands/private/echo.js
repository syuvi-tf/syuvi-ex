const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('echo last message sent to another channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('#channel to echo to')
        .setRequired(true)),
  async execute(interaction) {

    const channel = interaction.options.getChannel('channel');
    const messages = await interaction.channel.messages.fetch({ limit: 1, cache: false });
    const message = messages.first();
    await interaction.deferReply();

    if (message) {
      if (message.embeds.length === 1) {
        const echoMessage = await channel.send({ content: message.content, embeds: [message.embeds[0]] });
        await interaction.editReply(`✅ Message relayed. ${echoMessage.url}`);
      }
      else if (message.embeds.length === 0) {
        const echoMessage = await channel.send({ content: message.content });
        await interaction.editReply(`✅ Message relayed. ${echoMessage.url}`);
      }
      else {
        await interaction.editReply(`❌ Message couldn't be relayed.`);
      }
    }
    else {
      await interaction.editReply(`❌ Message couldn't be relayed.`);
    }
  },
};