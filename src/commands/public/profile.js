import { SlashCommandBuilder } from "discord.js";
import { getPlayer, createPlayer } from "../../lib/database.js";
import { getPlayerEmbed } from "../../lib/components.js";

export default {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("view a player's profile")
    .addUserOption((option) => option.setName("player").setDescription("@user")),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const member = interaction.options.getMember("player") ?? interaction.member;
    const player = getPlayer(member.id) ?? createPlayer(member.id, member.displayName);

    interaction.editReply({ embeds: [getPlayerEmbed(member.user, player)] });
  },
};
