const { divisionRoleIds } = require('../lib/guild-ids.js');
const { getPlayer } = require('../lib/database.js');

async function memberJoin(member) {
  const player = getPlayer(member.id);
  if (player) {
    const roles = member.guild.roles.cache;
    if (player.soldier_division) {
      const soldierRole = roles.get(divisionRoleIds.get(`${player.soldier_division} Soldier`));
      await member.roles.add(soldierRole);
    }
    if (player.demo_division) {
      const demoRole = roles.get(divisionRoleIds.get(`${player.soldier_division} Demo`));
      await member.roles.add(demoRole);
    }
  }
}
module.exports = {
  memberJoin
}