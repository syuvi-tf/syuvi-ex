import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getPlayerByDisplayName } from "../../lib/database.js";
import { getPlayerEmbed } from "../../lib/components.js";

function noPlayer(interaction) {
  interaction.editReply(`❌ No player exists with this display name.`);
}

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
      const member = await interaction.guild.members.fetch({
        user: player.discord_id,
        cache: false,
      });
      if (member) {
        interaction.editReply({ embeds: [getPlayerEmbed(member.user, player)] });
      } else {
        noPlayer(interaction);
      }
    } else {
      noPlayer(interaction);
    }
  },
};
