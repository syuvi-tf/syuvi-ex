const { SlashCommandBuilder, EmbedBuilder, userMention, hyperlink, subtext } = require('discord.js');
const { getPlayer, createPlayer, getActiveTourney, getTourneyPlayer, createTourneyTime, getPlayerBestTourneyTime } = require('../../lib/database.js');
const { getPlayerEmbed } = require('../../lib/components.js');
const { getTourneyMap, formatTime, getTimeSectionsArray } = require('../../lib/shared-functions.js');

async function noTourneyOrPlayer(interaction, trny) {
  if (!trny) {
    await interaction.editReply({
      content: `There's no ongoing tourney..`,
    });
  }
  else {
    await interaction.editReply({
      content: `Couldn't submit your time, as you're not signed up.
${subtext(`or a strange unhandled error`)}`,
    });
  }
}

async function noTempusIDOrDivision(interaction, player) {
  if (!player.tempus_id) {
    await interaction.editReply({
      content: `Couldn't submit your time, as you're missing a Tempus ID.`,
      embeds: [getPlayerEmbed(interaction.user, player)]
    });
  }
  else {
    await interaction.editReply({
      content: `Couldn't submit your time, as you're missing a division.`,
      embeds: [getPlayerEmbed(interaction.user, player)]
    });
  }
}

async function getTempusTime(player, map, trnyclass) {
  const response = await (await fetch(`https://tempus2.xyz/api/v0/maps/name/${map}/zones/typeindex/map/1/records/player/${player.tempus_id}/${trnyclass}`)).json();
  return response;
}

function getVerifiedEmbed(user, time, time_id, tempusPRId, trnyclass, map) {
  const embed = new EmbedBuilder()
    .setColor('A69ED7')
    .setThumbnail(user.avatarURL())
    .setDescription(`TF2PJ | (${trnyclass}) ${userMention(user.id)} submitted ${time}
on ${map}
${subtext(`time ID: ${time_id}`)}

${hyperlink('run details on Tempus', `https://tempus2.xyz/records/${tempusPRId}`)}`);
  return embed;
}

function getUnverifiedEmbed(user, time, time_id, tempusPRTime, trnyclass, map) {
  const minutes = String(Math.floor(tempusPRTime / 60)).padStart(2, '0');
  const seconds = String(Math.floor(tempusPRTime % 60)).padStart(2, '0');
  const ms = String(Math.floor((tempusPRTime % 1) * 100)).padStart(2, '0');
  const embed = new EmbedBuilder()
    .setColor('F97583')
    .setThumbnail(user.avatarURL())
    .setDescription(`TF2PJ | (${trnyclass}) ${userMention(user.id)} submitted ${time}
on ${map}
${subtext(`time ID: ${time_id}`)}

${subtext(`unverified: Tempus PR is ${minutes}:${seconds}.${ms}`)}`);
  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('submit')
    .setDescription('submit a time for the current tourney')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('format: MM:SS.ss')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply(); //thinking...
    const time = interaction.options.getString('time');
    const member = interaction.member;
    const player = getPlayer(member.id) ?? createPlayer(member.id, member.displayName);
    const trny = getActiveTourney();
    const now = new Date(new Date().toUTCString());

    // no in-progress tourney, or no signed_up tourney player 
    if (!trny || !getTourneyPlayer(trny.id, player.id) || getTourneyPlayer(trny.id, player.id).signed_up === 0) {
      noTourneyOrPlayer(interaction, trny);
      return;
    }
    // try to submit time now
    const trny_class = trny.class === 'Soldier' ? 3 : 4;
    const division = trny_class === 3 ? player.soldier_division : player.demo_division;
    // no tempus id or division, show player info
    if (!player.tempus_id || !division) {
      noTempusIDOrDivision(interaction, player);
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
      const timeParts = getTimeSectionsArray(time);
      const timeSeconds = timeParts.length === 2 ? parseFloat(time) //SS.ss
        : parseFloat(`${(parseInt(timeParts[0]) * 60) + parseInt(timeParts[1])}.${timeParts[2]}`);
      const tempusTime = {
        id: response?.result.id,
        date: new Date(parseInt(response?.result.date * 1000)),
        time: response?.result.duration,
      }
      // no tempus PR, or tempus API down
      if (!tempusTime.id || !tempusTime.date || !tempusTime.time) {
        await interaction.editReply({
          content: `Couldn't find a Tempus PR. If the Tempus API isn't down, check your Tempus ID.`,
          embeds: [getPlayerEmbed(interaction.user, player)]
        });
      }
      // verified
      else if (tempusTime.date > new Date(trny.starts_at) && Math.abs(timeSeconds - tempusTime.time) <= 0.02) {
        const time_id = createTourneyTime(trny.id, player.id, tempusTime.time, true);
        const embed = getVerifiedEmbed(interaction.user, time, time_id, tempusTime.id, trny.class, map);
        await interaction.editReply({ embeds: [embed] });
      }
      // unverified
      else if (timeSeconds > tempusTime.time) {
        const previousTime = getPlayerBestTourneyTime(trny.id, player.id);
        // check if time is slower than tourney PR
        if (previousTime < timeSeconds) {
          await interaction.editReply(`Couldn't submit this time, as it's slower than your tourney PR.
${subtext(`tourney PR: ${formatTime(previousTime, true)}`)}`);
        }
        else {
          const time_id = createTourneyTime(trny.id, player.id, timeSeconds, false);
          const embed = getUnverifiedEmbed(interaction.user, time, time_id, tempusTime.time, trny.class, map);
          await interaction.editReply({ embeds: [embed] });
        }
      }
      // submitted time is faster than tempus PR, or old tempus PR was attempted to submit
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