import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getPlayerByDisplayName } from "../../lib/database.js";
import { getPlayerEmbed } from "../../lib/components.js";

export default {
  data: new SlashCommandBuilder()
    .setName("profilebyname")
    .setDescription("view a player's profile")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) =>
      option.setName("player").setDescription("display name").setRequired(true),
    ),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const displayName = interaction.options.getString("player");
    const player = getPlayerByDisplayName(displayName);
    if (player) {
      const member = interaction.guild.members.get(player.discord_id);
      interaction.editReply({ embeds: [getPlayerEmbed(member, player)] });
    } else {
      interaction.editReply(`❌ No player exists with this display name.`);
    }
  },
};
