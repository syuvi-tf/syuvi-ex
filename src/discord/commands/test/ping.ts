import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('replies with pong!'),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.reply('pong!');
  },
};
