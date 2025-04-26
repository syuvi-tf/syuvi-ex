const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const sqlite = require('sqlite3');

function update_DB(members) {
  const db = new sqlite.Database('jump.db');

  members.forEach(member => {
    const soldierRole = member.roles.cache.find((role) => role.name.includes('Soldier'));
    const soldierDiv = soldierRole === undefined ? null : `${soldierRole.name.substring(0, soldierRole.name.indexOf(' '))}`;
    const demoRole = member.roles.cache.find((role) => role.name.includes('Demo'));
    const demoDiv = demoRole === undefined ? null : `${demoRole.name.substring(0, demoRole.name.indexOf(' '))}`;

    db.run(`UPDATE players
      SET userDisplayName = ?,
          soldierDiv = ?,
          demoDiv = ?
      WHERE userId = ?`, member.displayName, soldierDiv, demoDiv, member.id);
  });
  db.close();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('refreshdivisions')
    .setDescription('force update divisions for every player')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const confirm = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('confirm')
      .setStyle(ButtonStyle.Success);
    const cancel = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('cancel')
      .setStyle(ButtonStyle.Secondary);
    const confirmRow = new ActionRowBuilder()
      .addComponents(confirm, cancel);

    const response = await interaction.reply({
      content: `this will update the divisions and display names for every player according to their discord roles. this command may be expensive, so please only use it when necessary!`,
      components: [confirmRow],
      withResponse: true,
    });

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
      const confirmResponse = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 30_000 });

      if (confirmResponse.customId === 'confirm') {
        update_DB(interaction.guild.members.cache);
        await confirmResponse.update({
          content: `updated divisions and display names`,
          components: []
        });
      }
      else if (confirmResponse.customId === 'cancel') {
        await confirmResponse.update({
          content: `canceled command.`,
          components: []
        });
      }
    } catch {
      await interaction.editReply({
        content: `timed out or ran into an error.. canceled command.`,
        components: []
      });
    }
  },
};