const { SlashCommandBuilder, inlineCode } = require('discord.js');
const { setIds } = require('../../lib/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('links your Tempus ID to verify run times')
    .addIntegerOption(option =>
      option.setName('tempus_id')
        .setDescription('from your tempus2.xyz url')
        .setMinValue(1)
        .setMaxValue(9999999)
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const tempus_id = interaction.options.getInteger('tempus_id');

    const response = await (await fetch(`https://tempus2.xyz/api/v0/players/id/${tempus_id}/info`)).json();
    const tempusName = response.name;
    const steam_id32 = response.steamid;

    try {
      setIds(interaction.user.id, tempus_id, steam_id32);
      await interaction.editReply(`set your Tempus ID\n` +
        `your last online tempus alias is ${inlineCode(tempusName)}`);
    }
    catch {
      await interaction.editReply(`couldn't set your Tempus ID. do you have a division?`);
    }
  },
};