const { SlashCommandBuilder, MessageFlags } = require('discord.js');

// submits a time if
// - a tournament is underway (time > start time)
// - player has a division role
// - /submit is used in the correct division channel
// - submitted time is better than the previous submitted time
// queries tempus API to verify submitted time (time submitted > start time)
// if not verified, time is still okay to submit, but flagged for manual review

module.exports = {
  data: new SlashCommandBuilder()
    .setName('submit')
    .setDescription('submits a time for the current tourney'),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }); //thinking...
  },
};