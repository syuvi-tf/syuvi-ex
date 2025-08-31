import dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';
import guild from './lib/discord/guild-constants.js';
import commands from './commands.js';

dotenv.config();

const guildCommands = [];
for (const command of commands) {
  if (!command.data || !command.execute) {
    console.log(`[warning] a command is missing a required "data" or "execute" property`);
    continue;
  }

  guildCommands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN ?? 'null');

// Deploy commands
(async (): Promise<void> => {
  try {
    console.log(`started refreshing ${guildCommands.length} application (/) commands`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data: unknown = await rest.put(
      Routes.applicationGuildCommands(guild.userID, guild.guildID), //guild-specific
      // Routes.applicationCommands(clientId), //global
      { body: guildCommands }
    );

    console.log(`reloaded ${(data as []).length} application (/) commands`);
  } catch (error) {
    console.error(error);
  }
})();

// Remove commands
const guildCommandsToRemove: string[] = [];
for (const commandID of guildCommandsToRemove) {
  rest
    .delete(Routes.applicationGuildCommand(guild.userID, guild.guildID, commandID)) // use Routes.applicationCommand for global
    .then(() => console.log('successfully removed guild command'))
    .catch(console.error);
}
