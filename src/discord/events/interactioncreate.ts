import { BaseInteraction, Events, MessageFlags } from 'discord.js';

// only receive slash commands
export default {
  name: Events.InteractionCreate,
  async execute(interaction: BaseInteraction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`[error] No command matching ${interaction.commandName} was found.`);
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: `encountered an error running this command`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: 'encountered an error running this command',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
