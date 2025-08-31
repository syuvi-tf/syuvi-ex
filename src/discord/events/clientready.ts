import { Client, Events } from 'discord.js';
import database from '../../sqlite/database.js';
import { testRoutine } from '../../schedule/marathon.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: Client): void {
    if (client.isReady()) {
      console.log(`[syuvi] ready! logged in as ${client.user.tag}`);

      database.createTables();

      testRoutine();
    } else {
      console.log(`[error] received Events.ClientReady, but client.isReady() reported false`);
    }
  },
};

// close sqlite database
process.on('beforeExit', () => {
  database.close();
});
