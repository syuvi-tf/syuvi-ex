import dotenv from "dotenv";
import { REST, Routes } from "discord.js";
import { guildId, clientId } from "./lib/guild-ids.js";
import { allCommands } from "./commands/commands.js";

dotenv.config();

const commands = [];
for (const command of allCommands) {
  if (!command.data || !command.execute) {
    console.log(`[WARNING] Command is missing a required "data" or "execute" property.`);
    continue;
  }

  commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId), //guild-specific
      // Routes.applicationCommands(clientId), //global
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();

// Remove commands
const commandsToRemove = [];
for (const commandId of commandsToRemove) {
  rest
    .delete(Routes.applicationGuildCommand(clientId, guildId, commandId)) // use Routes.applicationCommand for global
    .then(() => console.log("Successfully deleted guild command"))
    .catch(console.error);
}