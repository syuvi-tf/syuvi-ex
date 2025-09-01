import { Collection } from 'discord.js';

type Command = {
  data: SlashCommandOptionsOnlyBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
};

// add commands property to Client
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}
