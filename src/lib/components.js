const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const confirm = new ButtonBuilder()
  .setCustomId('confirm')
  .setLabel('confirm')
  .setStyle(ButtonStyle.Success);
const cancel = new ButtonBuilder()
  .setCustomId('cancel')
  .setLabel('cancel')
  .setStyle(ButtonStyle.Secondary);
const confirmRow = new ActionRowBuilder().addComponents(confirm, cancel);

module.exports = {
  confirmRow
}