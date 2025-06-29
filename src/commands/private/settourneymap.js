import { SlashCommandBuilder, PermissionFlagsBits, inlineCode } from "discord.js";
import { getActiveTourney, getOngoingTourney, updateTourneyMap } from "../../lib/database.js";

// option: division, option: map name

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settourneymap')
    .setDescription('update a map for the upcoming tourney')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('division')
        .setDescription('map division')
        .setRequired(true)
        .addChoices(
          { name: 'PlatGold', value: 'PlatGold' },
          { name: 'Silver', value: 'Silver' },
          { name: 'Bronze', value: 'Bronze' },
          { name: 'Steel', value: 'Steel' },
          { name: 'Wood', value: 'Wood' },)
    )
    .addStringOption(option =>
      option.setName('map')
        .setDescription('map name')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const mapDivision = interaction.options.getString('division');
    const mapName = interaction.options.getString('map');
    const trny = getActiveTourney();
    const isOngoing = getOngoingTourney() ? true : false;
    if (isOngoing) {
      interaction.editReply(`Couldn't change maps, as this tourney has already started.`);
    }
    else if (trny.class === 'Demo' && mapDivision === 'Wood') {
      interaction.editReply(`Couldn't change maps, since Demo doesn't have a Wood division.`);
    }
    else {
      if (trny) {
        switch (mapDivision) {
          case 'PlatGold':
            trny.plat_gold_map = mapName;
            break;
          case 'Silver':
            trny.silver_map = mapName;
            break;
          case 'Bronze':
            trny.bronze_map = mapName;
            break;
          case 'Steel':
            trny.steel_map = mapName;
            break;
          case 'Wood':
            trny.wood_map = mapName;
            break;
        }
        updateTourneyMap(trny);

        interaction.editReply(`${trny.class} tournament maps updated to..
Platinum / Gold: ${inlineCode(trny.plat_gold_map)}
Silver: ${inlineCode(trny.silver_map)}
Bronze: ${inlineCode(trny.bronze_map)}
Steel: ${inlineCode(trny.steel_map)}
${trny.class === 'Soldier' ? `Wood: ${inlineCode(trny.wood_map)}` : ``}`);
      }
    }
  },
};