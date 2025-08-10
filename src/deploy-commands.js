import dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';
import { clientID, guildID } from './lib/guild-ids.ts';
import commands from './discord/commands/commands.ts';

dotenv.config();

const guildCommands = [];
for (const command of commands) {
  if (!command.data || !command.execute) {
    console.log(`[WARNING] Command is missing a required "data" or "execute" property.`);
    continue;
  }

  guildCommands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(`Started refreshing ${guildCommands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientID, guildID), //guild-specific
      // Routes.applicationCommands(clientId), //global
      { body: guildCommands }
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();

// Remove commands
const guildCommandsToRemove = [];
for (const commandID of guildCommandsToRemove) {
  rest
    .delete(Routes.applicationGuildCommand(clientID, guildID, commandID)) // use Routes.applicationCommand for global
    .then(() => console.log('Successfully deleted guild command'))
    .catch(console.error);
}
