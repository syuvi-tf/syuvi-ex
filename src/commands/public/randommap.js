const { SlashCommandBuilder } = require('discord.js');
const { getMapEmbed } = require('../../lib/components.js');

function getRandomMapId(maps, tier, rating) {
  if (!tier && !rating) { // any map
    const randomIndex = Math.floor(Math.random() * maps.length);
    return maps[randomIndex].id;
  }
  else if (!tier) { // specific rating
    const filteredMaps = maps.filter((map) => map.rating_info[rating.class] === rating.rating);
    if (filteredMaps.length === 0) { return `There are no ${rating.class === '3' ? 'Soldier' : 'Demo'} R${rating.rating} maps..`; }
    const randomIndex = Math.floor(Math.random() * filteredMaps.length);
    return filteredMaps[randomIndex].id;

  }
  else if (!rating) { // specific tier
    const filteredMaps = maps.filter((map) => map.tier_info[tier.class] === tier.tier);
    if (filteredMaps.length === 0) { return `There are no ${tier.class === '3' ? 'Soldier' : 'Demo'} T${tier.tier} maps..`; }
    const randomIndex = Math.floor(Math.random() * filteredMaps.length);
    return filteredMaps[randomIndex].id;
  }
  else { // specific rating and tier
    const filteredMaps = maps.filter((map) => map.rating_info[rating.class] === rating.rating
      && map.tier_info[tier.class] === tier.tier);
    if (filteredMaps.length === 0) { return `There are no ${tier.class === '3' ? 'Soldier' : 'Demo'} T${tier.tier} and ${rating.class === '3' ? 'Soldier' : 'Demo'} R${rating.rating} maps..`; }
    const randomIndex = Math.floor(Math.random() * filteredMaps.length);
    return filteredMaps[randomIndex].id;
  }
}

// TODO: format cooler
module.exports = {
  data: new SlashCommandBuilder()
    .setName('randommap')
    .setDescription('roll for a random map from Tempus!')
    .addStringOption(option =>
      option.setName('tier')
        .setDescription('tier')
        .addChoices(
          { name: 'Soldier T1', value: 'Soldier T1' },
          { name: 'Soldier T2', value: 'Soldier T2' },
          { name: 'Soldier T3', value: 'Soldier T3' },
          { name: 'Soldier T4', value: 'Soldier T4' },
          { name: 'Soldier T5', value: 'Soldier T5' },
          { name: 'Soldier T6', value: 'Soldier T6' },
          { name: 'Soldier T7', value: 'Soldier T7' },
          { name: 'Soldier T8', value: 'Soldier T8' },
          { name: 'Soldier T9', value: 'Soldier T9' },
          { name: 'Soldier T10', value: 'Soldier T10' },
          { name: 'Demo T1', value: 'Demo T1' },
          { name: 'Demo T2', value: 'Demo T2' },
          { name: 'Demo T3', value: 'Demo T3' },
          { name: 'Demo T4', value: 'Demo T4' },
          { name: 'Demo T5', value: 'Demo T5' },
          { name: 'Demo T6', value: 'Demo T6' },
          { name: 'Demo T7', value: 'Demo T7' },
          { name: 'Demo T8', value: 'Demo T8' },
          { name: 'Demo T9', value: 'Demo T9' },
          { name: 'Demo T10', value: 'Demo T10' },)
    )
    .addStringOption(option =>
      option.setName('rating')
        .setDescription('rating (1 = good, 4 = bad)')
        .addChoices(
          { name: 'Soldier R1', value: 'Soldier R1' },
          { name: 'Soldier R2', value: 'Soldier R2' },
          { name: 'Soldier R3', value: 'Soldier R3' },
          { name: 'Soldier R4', value: 'Soldier R4' },
          { name: 'Demo R1', value: 'Demo R1' },
          { name: 'Demo R2', value: 'Demo R2' },
          { name: 'Demo R3', value: 'Demo R3' },
          { name: 'Demo R4', value: 'Demo R4' },)
    ),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const tierOption = interaction.options.getString('tier');
    const tier = tierOption ? { class: tierOption.includes('Soldier') ? '3' : '4', tier: parseInt(tierOption.match(/\d+/g)[0]) } : null;
    const ratingOption = interaction.options.getString('rating');
    const rating = ratingOption ? { class: ratingOption.includes('Soldier') ? '3' : '4', rating: parseInt(ratingOption.match(/\d+/g)[0]) } : null;
    const maps = await (await fetch(`https://tempus2.xyz/api/v0/maps/detailedList`)).json();

    const mapId = getRandomMapId(maps, tier, rating);
    const mapEmbed = await getMapEmbed(mapId);
    const response = await interaction.editReply({ embeds: [mapEmbed] });
    if (mapId === '644') { // easter egg
      response.react('🗻');
    }
  },
};