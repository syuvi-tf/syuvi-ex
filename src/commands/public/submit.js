const { SlashCommandBuilder, EmbedBuilder, userMention, inlineCode, hyperlink, subtext } = require('discord.js');
const { getPlayer, createPlayer, getActiveTourney, createTourneyTime, getTourneyPlayer } = require('../../lib/database.js');

// MM:SS.SS (MM: optional)
function isValidTime(time) {
  const validRegex = /^((\d{0,2}):)?(\d{2}).(\d{2})$/g;
  return validRegex.test(time);
}

// return String[] of {MM,SS,SS} or {SS,SS}
function getTimeParts(time) {
  const partRegex = /\d{0,2}/g;
  return time.match(partRegex);
}

// from /info command
// function getPlayerEmbed(player)

async function noTourneyOrPlayer(interaction, trny) {
  if (!trny) {
    await interaction.editReply({
      content: `There's no ongoing tourney..`,
    });
  }
  else {
    await interaction.editReply({
      content: `Couldn't submit your time, as you're not signed up.`,
    });
  }
}

async function noTempusIDOrDivision(interaction, player, discord_id) {
  if (!player.tempus_id) {
    await interaction.editReply({
      content: `Couldn't submit your time, as you're missing a Tempus ID.`,
      embeds: [getPlayerEmbed(player, discord_id)]
    });
  }
  else {
    await interaction.editReply({
      content: `Couldn't submit your time, as you're missing a division.`,
      embeds: [getPlayerEmbed(player, discord_id)]
    });
  }
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
      console.log(`/submit error: couldn't find a tourney map..`);
  }
}

function getSubmitEmbed(member, time, time_id, tempusPRId, trnyclass, map) {
  const embed = new EmbedBuilder()
    .setColor('A69ED7')
    .setThumbnail(member.avatarURL())
    .setDescription(`TF2PJ | (${trnyclass}) ${userMention(member.id)} submitted ${time}
on ${map}
${subtext(`time ID: ${time_id}`)}`)
    .addFields({ name: '\u200b', value: hyperlink('run details on Tempus', `https://tempus2.xyz/records/${tempusPRId}`) })
  return embed;
}

function getUnverifiedEmbed(member, time, time_id, tempusPRTime, trnyclass, map) {
  const minutes = String(Math.floor(tempusPRTime / 60)).padStart(2, '0');
  const seconds = String(Math.floor(tempusPRTime % 60)).padStart(2, '0');
  const ms = String(Math.floor((tempusPRTime % 1) * 100)).padStart(2, '0');
  const embed = new EmbedBuilder()
    .setColor('F97583')
    .setThumbnail(member.avatarURL())
    .setDescription(`TF2PJ | (${trnyclass}) ${userMention(member.id)} submitted ${time}
on ${map}
${subtext(`time ID: ${time_id}`)}`)
    .setFooter({ text: `Unverified: Tempus PR is ${minutes}: ${seconds}.${ms}` })
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
    const member = interaction.member;
    const player = getPlayer(member.id) ?? createPlayer(member.id, member.displayName);
    const trny = getActiveTourney();
    const now = new Date(new Date().toUTCString());

    // no in-progress tourney, or no signed_up tourney player 
    if (!trny || now < new Date(trny.starts_at) || new Date(trny.ends_at) > now || !getTourneyPlayer(trny.id, player.id) || getTourneyPlayer(trny.id_player).signed_up === 0) {
      noTourneyOrPlayer(interaction, trny);
      return;
    }
    // try to submit time now
    const trny_class = trny.class === 'Soldier' ? 3 : 4;
    const division = trny_class === 3 ? player.soldier_division : player.demo_division;
    // no tempus id or division, show player info
    if (!player.tempus_id || !division) {
      noTempusIDOrDivision(interaction, trny.id, player);
    }
    // invalid time
    else if (!isValidTime(time)) {
      await interaction.editReply({
        content: `Couldn't submit your time, as it's not in the expected format.
${subtext(`format: MM:SS.ss / SS.ss`)}`,
      });
    }
    // tempus PR wasn't during tourney, time submitted is faster than tempus PR, 
    else {
      const map = getTourneyMap(trny, division);
      const response = await getTempusTime(player, map, trny_class);
      const timeParts = getTimeParts(time);
      const timeSeconds = timeParts.length === 2
        ? parseFloat(time) // SS.SS
        : parseFloat(`${(parseInt(timeParts[0]) * 60) + parseInt(timeParts[1])}.${timeParts[2]} `); // MM:SS.ss
      const tempusTime = {
        id: response?.result.id,
        date: new Date(parseInt(response?.result.date * 1000)),
        time: response?.result.duration,
      }
      // no tempus PR, or tempus API down
      if (!tempusTime.id || !tempusTime.date || !tempusTime.time) {
        await interaction.editReply({
          content: `Couldn't find a Tempus PR. If the Tempus API isn't down, check your Tempus ID.`,
          embeds: [getPlayerEmbed(player, member.id)]
        });
      }
      // verified
      else if (tempusTime.date > new Date(trny.starts_at) && Math.abs(timeSeconds - tempusTime.time) <= 0.02) {
        const time_id = createTourneyTime(trny.id, player.id, tempusTime.time, true);
        const embed = getSubmitEmbed(interaction.member, time, time_id, tempusTime.id, trny.class, map);
        await interaction.editReply({ embeds: [embed] });
      }
      // unverified
      else if (timeSeconds > tempusTime.time) {
        const time_id = createTourneyTime(trny.id, player.id, timeSeconds, false);
        const embed = getUnverifiedEmbed(interaction.member, time, time_id, tempusTime.time, trny.class, map);
        await interaction.editReply({ embeds: [embed] });
      }
      // submitted time is faster than PR, or old PR was attempted to submit
      else {
        if (Math.abs(timeSeconds - tempusTime.time) <= 0.02) {
          await interaction.editReply({
            content: `Couldn't submit your time, as it's an old PR.`,
          });
        }
        else {
          await interaction.editReply({
            content: `Couldn't submit your time, as it's faster than your Tempus PR.`,
          });
        }
      }
    }
  },
};