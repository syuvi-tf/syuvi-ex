const { SlashCommandBuilder, EmbedBuilder, userMention, inlineCode, hyperlink } = require('discord.js');
const { getPlayer, getActiveTourney, createTourneyTime } = require('../../lib/database.js');

function isValidTime(time) {
  const validRegex = /^(\d+)*:\d+.\d+$/g;
  return validRegex.test(time);
}

function getTimeParts(time) {
  const partRegex = /\d+/g;
  return time.match(partRegex);
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
  if (isValidTime(time)) {
    await interaction.editReply(`Couldn't submit your time, as there doesn't seem to be a tourney active.`);
  }
  else {
    await interaction.editReply(`Couldn't submit ${inlineCode(time)}. Is your time in the right format?`);
  }
}

function getSubmitEmbed(user, time, timeId, trnyclass, map) {
  const embed = new EmbedBuilder()
    .setColor('A69ED7')
    .setThumbnail(user.avatarURL())
    .setDescription(`TF2PJ | (${trnyclass}) ${userMention(user.id)} submitted ${time}
    on ${map}`)
    .addFields({ name: '\u200b', value: hyperlink('run details on Tempus', `https://tempus2.xyz/records/${timeId}`) })
    .setTimestamp();
  return embed;
}

function getUnverifiedEmbed(user, time, tempusPRTime, trnyclass, map) {
  const minutes = String(Math.floor(tempusPRTime / 60)).padStart(2, '0');
  const seconds = String(Math.floor(tempusPRTime % 60)).padStart(2, '0');
  const ms = String(Math.floor((tempusPRTime % 1) * 100)).padStart(2, '0');
  const embed = new EmbedBuilder()
    .setColor('F97583')
    .setThumbnail(user.avatarURL())
    .setDescription(`TF2PJ | (${trnyclass}) ${userMention(user.id)} submitted ${time}
    on ${map}`)
    .setFooter({ text: `Unverified: Tempus PR is ${minutes}:${seconds}.${ms}` })
    .setTimestamp();
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
    const player = getPlayer(interaction.user.id) ?? { tempus_id: null }; // handle non-existing player
    // may fail later if trny is undefined
    const trny = getActiveTourney(); // returns undefined if no tourney is active
    // TODO: reap the consequences of a trny being immediately undefined
    const trnyclass = trny.class === 'Soldier' ? 3 : 4;
    const division = trnyclass === 3 ? player.soldier_division : player.demo_division;
    const map = getTourneyMap(trny, division);
    const now = new Date(new Date().toUTCString());

    if (player.tempus_id === null || division === null) { //missing tempus_id or division
      await interaction.editReply({
        content: `Couldn't submit your time, as you're missing a Tempus ID or division.`,
      });
    }
    else if (isValidTime(time) && trny !== undefined && new Date(trny.starts_at) < now && new Date(trny.ends_at) > now) {
      const parts = getTimeParts(time);
      const timeSeconds = parts.length === 2 ? parseFloat(time) //SS.SS
        : parseFloat(`${(parseInt(parts[0]) * 60) + parseInt(parts[1])}.${parts[2]}`);
      const response = await getTempusTime(player, map, trnyclass); // may fail if there is no tempus PR?
      if (!response.result || !response) {
        await interaction.editReply({
          content: `Couldn't find any Tempus PR. Is your Tempus ID correct, or is the Tempus API down? (${inlineCode('Tempus ID: ' + player.tempus_id)})`,
        });
      }
      else {
        const tempusPRTime = response.result.duration;
        const tempusPRDate = new Date(parseInt(response.result.date * 1000));
        const tempusPRId = response.result.id;

        // not possible for tempus PR Date to be in the future 
        if (tempusPRDate > new Date(trny.starts_at) && Math.abs(timeSeconds - tempusPRTime) <= 0.02) {
          // submit time
          createTourneyTime(trny.id, player.id, tempusPRTime, true);
          const embed = getSubmitEmbed(interaction.user, time, tempusPRId, trny.class, map);
          await interaction.editReply({ embeds: [embed] });
        }
        else { // PR date is before the tourney started, or PR time isn't the submitted time (don't reveal this)
          if (tempusPRTime < timeSeconds) { // submitted run slower than PR, say the submit is unverified
            createTourneyTime(trny.id, player.id, timeSeconds, false);
            const embed = getUnverifiedEmbed(interaction.user, time, tempusPRTime, trny.class, map);
            await interaction.editReply({ embeds: [embed] });
          }
          else { // tempus PR slower than submitted time, or tried to submit an old PR
            await interaction.editReply(`Couldn't submit ${inlineCode(time)}. An old PR was submitted, or your Tempus PR is slower than the submitted time.`);
          }
        }
      }
    }
    else { // invalid time format, or no tourney active
      await invalidFormatOrTourney(interaction, time);
    }
  },
};

// old submit embed style
//
// function getSubmitEmbed(user, time, timeId, trnyclass, map) {
//   const embed = new EmbedBuilder()
//     .setColor('A69ED7')
//     .setThumbnail(user.avatarURL())
//     .setDescription(`TF2PJ | (${trnyclass}) ${userMention(user.id)} submitted ${time}
//     on ${map}`)
//     .addFields({ name: '\u200b', value: hyperlink('run details on Tempus', `https://tempus2.xyz/records/${timeId}`) });
//   return embed;
// }