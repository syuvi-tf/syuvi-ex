const { SlashCommandBuilder, EmbedBuilder, MessageFlags, userMention, inlineCode, hyperlink } = require('discord.js');
const { getPlayer, getActiveTourney, createTourneyTime } = require('../../lib/database.js');

function isValidTime(time) {
  const validRegex = /(\d+)*:\d+.\d+/g;
  return validRegex.test(time);
}

function getTimeParts(time) {
  const partRegex = /\d+/g;
  return partRegex.exec(time);
}

async function getTempusTime(player, map, trnyclass) {
  const response = await (await fetch(`https://tempus2.xyz/api/v0/maps/name/${map}/zones/typeindex/map/1/records/player/${player.tempus_id}/${trnyclass}`)).json();
  return response;
}

function getTourneyMap(trny, division) {
  switch (division) {
    case 'Platinum':
    case 'Gold':
      return trny.plat_gold_map;
    case 'Silver':
      return trny.silver_map;
    case 'Bronze':
      return trny.bronze_map;
    case 'Steel':
      return trny.steel_map;
    case 'Wood':
      return trny.wood_map;
    default:
      console.error(`/submit error: couldn't find a tourney map..`);
  }
}

async function invalidFormatOrTourney(interaction, time) {
  if (!isValidTime(time)) {
    await interaction.editReply({ content: `Couldn't submit ${inlineCode(isValidTime(time))}. Is your time in the right format?`, flags: MessageFlags.Ephemeral });
  }
  else {
    await interaction.editReply({ content: `Couldn't submit your time, as there doesn't seem to be a tourney active.` })
  }
}

function getSubmitEmbed(user, time, timeId, trnyclass, map) {
  const embed = new EmbedBuilder()
    .setColor('A69ED7')
    .setThumbnail(user.avatarURL())
    .setDescription(`TF2PJ | (${trnyclass}) ${userMention(user.id)} submitted ${time}
    on ${map}`)
    .addFields({ name: '\u200b', value: hyperlink('view run page', `https://tempus2.xyz/records/${timeId}`) });
  return embed;
}

function getUnverifiedEmbed(user, time, tempusPRTime, trnyclass, map) {
  const minutes = Math.floor(tempusPRTime) / 60;
  const seconds = Math.floor(tempusPRTime % 60);
  const ms = tempusPRTime % 1;
  const embed = new EmbedBuilder()
    .setColor('F97583')
    .setThumbnail(user.avatarURL())
    .setDescription(`TF2PJ | (${trnyclass}) ${userMention(user.id)} submitted ${time}
    on ${map}`)
    .setFooter({ text: `unverified: tempus PR is ${minutes}:${seconds}.${ms}` });
  return embed;
}
module.exports = {
  data: new SlashCommandBuilder()
    .setName('submit')
    .setDescription('submit a time for the current tourney')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('format: MM:SS.SS')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const time = interaction.options.getString('time');
    const player = getPlayer(interaction.user.id);
    const trny = getActiveTourney(); // returns undefined if no tourney is active
    const trnyclass = trny.class === 'Soldier' ? 3 : 4;
    const division = trnyclass === 3 ? player.soldier_division : player.demo_division;
    const map = getTourneyMap(trny, division);
    const now = new Date(new Date().toUTCString());

    if (isValidTime(time) && trny !== undefined && new Date(trny.starts_at) < now && new Date(trny.ends_at) > now) {
      const parts = getTimeParts(time);
      const timeSeconds = parts.length === 2 ? parseFloat(time) //SS.SS
        : parseFloat(`${(parseInt(parts[0]) * 60) + parseInt(parts[1])}.${parts[2]}`);
      const response = await getTempusTime(player, map, trnyclass);
      const tempusPRTime = response.result.duration;
      const tempusPRDate = new Date(parseInt(response.result.date * 1000));
      const tempusPRId = response.result.id;

      // not possible for tempus PR Date to be in the future 
      if (tempusPRDate > new Date(trny.starts_at) && Math.abs(timeSeconds - tempusPRTime) <= 0.02) {
        // submit time
        createTourneyTime(trny.id, player.id, tempusPRTime);
        const embed = getSubmitEmbed(interaction.user, time, tempusPRId, trny.class, map);
        await interaction.editReply({ embeds: [embed] });
      }
      else { // PR date is before the tourney started, or PR time isn't the submitted time (don't reveal this)
        if (tempusPRTime < timeSeconds) { // unverified submit
          const embed = getUnverifiedEmbed(interaction.user, time, tempusPRTime, trny.class, map);
          await interaction.editReply({ embeds: [embed] });
        }
        else { // tempus PR slower than submitted time
          await interaction.editReply({ content: `Couldn't submit ${inlineCode(isValidTime(time))}. Is your submitted time slower than your Tempus PR?`, flags: MessageFlags.Ephemeral });
        }
      }

    }
    else { // invalid time format, or no tourney active
      await invalidFormatOrTourney(interaction, time);
    }
  },
};