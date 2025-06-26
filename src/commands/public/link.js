const { SlashCommandBuilder, inlineCode, EmbedBuilder, hyperlink } = require('discord.js');
const { createPlayer, getPlayer } = require('../../lib/database.js');
const { updatePlayerIds } = require('../../lib/database.js');

function getEmbed(tempusInfo) {
  const embed = new EmbedBuilder()
    .setColor('E1703D')
    .setAuthor({
      name: 'Tempus profile',
      url: `https://tempus2.xyz/players/${tempusInfo.id}`,
      iconURL: 'https://static-cdn.jtvnw.net/jtv_user_pictures/f6ba291c-cd4f-46f7-9b43-75ef77e887a5-profile_image-70x70.png'
    })
    .setDescription(`Set your Tempus ID. Last seen as ${inlineCode(tempusInfo.name)} 
> ${inlineCode(`Rank ${tempusInfo.srank} Soldier`)}
> ${inlineCode(`Rank ${tempusInfo.drank} Demo`)}`);
  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('link your Tempus ID to verify PR times')
    .addIntegerOption(option =>
      option.setName('tempus_id')
        .setDescription('from your tempus2.xyz url')
        .setMinValue(1)
        .setMaxValue(9999999)
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const tempusId = interaction.options.getInteger('tempus_id');
    const member = interaction.member;
    getPlayer(member.id) ?? createPlayer(member.id, member.displayName);
    const response = await (await fetch(`https://tempus2.xyz/api/v0/players/id/${tempusId}/stats`)).json();
    const tempusInfo = {
      name: response?.player_info.name,
      id: response?.player_info.id,
      steamId: response?.player_info.steamid,
      srank: response?.class_rank_info['3'].rank,
      drank: response?.class_rank_info['4'].rank,
    }

    if (!tempusInfo.name || !tempusInfo.steamId) {
      await interaction.editReply(`❌ Couldn't set your Tempus ID, as the request to Tempus failed.`);
    }
    else {
      updatePlayerIds(interaction.user.id, tempusId, tempusInfo.steamId);
      await interaction.editReply({ embeds: [getEmbed(tempusInfo)] });
    }
  },
};