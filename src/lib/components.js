const { ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, userMention, inlineCode, roleMention } = require('discord.js');
const { timesChannelIds } = require('./guild-ids.js');

const confirmRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('confirm')
    .setLabel('confirm')
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId('cancel')
    .setLabel('cancel')
    .setStyle(ButtonStyle.Secondary));

function getMapSelectModal(tourneyClass) {
  const modal = new ModalBuilder()
    .setCustomId('mapSelect')
    .setTitle(`${tourneyClass} Tourney Maps`);
  const platGoldMap = new TextInputBuilder()
    .setCustomId('plat_gold_map')
    .setLabel('Platinum / Gold Map')
    .setStyle(TextInputStyle.Short);
  const silverMap = new TextInputBuilder()
    .setCustomId('silver_map')
    .setLabel('Silver Map')
    .setStyle(TextInputStyle.Short);
  const bronzeMap = new TextInputBuilder()
    .setCustomId('bronze_map')
    .setLabel('Bronze Map')
    .setStyle(TextInputStyle.Short);
  const steelMap = new TextInputBuilder()
    .setCustomId('steel_map')
    .setLabel('Steel Map')
    .setStyle(TextInputStyle.Short);
  const woodMap = new TextInputBuilder()
    .setCustomId('wood_map')
    .setLabel('Wood Map')
    .setStyle(TextInputStyle.Short);

  const platGoldMapRow = new ActionRowBuilder().addComponents(platGoldMap)
  const silverMapRow = new ActionRowBuilder().addComponents(silverMap);
  const bronzeMapRow = new ActionRowBuilder().addComponents(bronzeMap);
  const steelMapRow = new ActionRowBuilder().addComponents(steelMap);
  const woodMapRow = new ActionRowBuilder().addComponents(woodMap);
  modal.addComponents(platGoldMapRow, silverMapRow, bronzeMapRow, steelMapRow);
  if (tourneyClass === 'Soldier') {
    modal.addComponents(woodMapRow); // wood only applies to soldier
  }
  return modal;
}

function getPlayerEmbed(player, discord_id) {
  const embed = new EmbedBuilder()
    .setColor('A69ED7')
    .setThumbnail(user.avatarURL())
    .setDescription(`Player Info for ${userMention(discord_id)}
Display Name: ${inlineCode(player.display_name)}
${player.soldier_division ? roleMention(timesChannelIds.get(player.soldier_division)) : `${inlineCode('No Soldier Division')}`}
${player.demo_division ? roleMention(timesChannelIds.get(player.demo_division)) : `${inlineCode('No Demo Division')}`}
Tempus ID: ${inlineCode(tempus_id)}
`)
  return embed;
}

module.exports = {
  confirmRow,
  getMapSelectModal,
  getPlayerEmbed,
}