const { ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

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
module.exports = {
  confirmRow,
  getMapSelectModal,
}