import { SlashCommandBuilder, PermissionFlagsBits, userMention } from "discord.js";
import { updatePlayerDisplayName, getPlayer, createPlayer } from "../../lib/database.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setdisplayname")
    .setDescription("update a player's display name from their discord nickname")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((option) => option.setName("player").setDescription("@user").setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const member = interaction.options.getMember('player');
    getPlayer(member.id) ?? createPlayer(member.id, member.displayName);
    updatePlayerDisplayName(member.id, member.displayName);
    interaction.editReply({
      content: `✅ Set ${userMention(member.id)}'s tourney display name`,
      allowedMentions: { users: [] },
    });
  },
};
