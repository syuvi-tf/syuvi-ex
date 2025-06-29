const schedule = require('node-schedule');
const { EmbedBuilder, userMention } = require('discord.js');
const { getActiveTourney, getTourneyPlayers } = require('./database.js');
const { timesChannelIds, signupsChannelId } = require('./guild-ids.js');
const { createTourneySheet, updateSheetTimes } = require('./sheet.js');
const { getMapEmbedByName, getTourneyTopTimesEmbed } = require('./components.js');

function resetFields(newEmbed, tourneyclass, num_players) {
  newEmbed.setFields(
    { name: 'Platinum', value: '\u200b' },
    { name: 'Gold', value: '\u200b' },
    { name: 'Silver', value: '\u200b' },
    { name: 'Bronze', value: '\u200b' },
    { name: 'Steel', value: '\u200b' },
  );
  if (tourneyclass === 'Soldier') {
    newEmbed.addFields({ name: 'Wood', value: '\u200b' });
  }
  newEmbed.addFields({ name: 'No Division', value: '\u200b' });
  newEmbed.setFooter({ text: `updates every minute (${num_players} signups)` });
  return newEmbed;
}

function startTourneyJob(datetime, channels) {
  const date = new Date(datetime); // from sqlite datetime
  schedule.scheduleJob(date, async function () {
    console.log('tried to start a tourney!');
    const trny = getActiveTourney();
    createTourneySheet(trny);
    updateSheetsJob();
    // send all times channels their division's map embed
    channels.get(timesChannelIds.get('Platinum')).send({ content: `🏁 A ${trny.class} tourney has started! The map is..`, embeds: [await getMapEmbedByName(trny.plat_gold_map)] });
    channels.get(timesChannelIds.get('Gold')).send({ content: `🏁 A ${trny.class} tourney has started! The map is..`, embeds: [await getMapEmbedByName(trny.plat_gold_map)] });
    channels.get(timesChannelIds.get('Silver')).send({ content: `🏁 A ${trny.class} tourney has started! The map is..`, embeds: [await getMapEmbedByName(trny.silver_map)] });
    channels.get(timesChannelIds.get('Bronze')).send({ content: `🏁 A ${trny.class} tourney has started! The map is..`, embeds: [await getMapEmbedByName(trny.bronze_map)] });
    channels.get(timesChannelIds.get('Steel')).send({ content: `🏁 A ${trny.class} tourney has started! The map is..`, embeds: [await getMapEmbedByName(trny.steel_map)] });
    if (trny.class === 'Soldier') {
      channels.get(timesChannelIds.get('Wood')).send({ content: `🏁 A ${trny.class} tourney has started! The map is..`, embeds: [await getMapEmbedByName(trny.wood_map)] });
    }
  });
}

function endTourneyJob(datetime, channels, trny) {
  const date = new Date(datetime); // from sqlite datetime
  schedule.scheduleJob(date, async function () {
    // update sheets one more time
    updateSheetTimes(trny);
    console.log('tried to end a tourney!');
    const signupChannel = await channels.get(signupsChannelId);
    const roles = await signupChannel.guild.roles;
    // TODO(ash): do we need to do this? signupMessage.delete() was commented out so deleting signups messages never happened.
    // delete signups message
    // const signupMessages = await signupChannel.messages.fetch({ limit: 1, cache: false });
    // const signupMessage = signupMessages.first();
    // it's likely better to have an admin delete the message whenever they'd like, if they want to archive the signups
    // signupMessage.delete();
    //
    // send all times channels an end message and fastest times
    channels.get(timesChannelIds.get('Platinum')).send({ content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`, embeds: [getTourneyTopTimesEmbed(trny, 'Platinum', roles)] });
    channels.get(timesChannelIds.get('Gold')).send({ content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`, embeds: [getTourneyTopTimesEmbed(trny, 'Gold', roles)] });
    channels.get(timesChannelIds.get('Silver')).send({ content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`, embeds: [getTourneyTopTimesEmbed(trny, 'Silver', roles)] });
    channels.get(timesChannelIds.get('Bronze')).send({ content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`, embeds: [getTourneyTopTimesEmbed(trny, 'Bronze', roles)] });
    channels.get(timesChannelIds.get('Steel')).send({ content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`, embeds: [getTourneyTopTimesEmbed(trny, 'Steel', roles)] });
    if (trny.class === 'Soldier') {
      channels.get(timesChannelIds.get('Wood')).send({ content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`, embeds: [getTourneyTopTimesEmbed(trny, 'Wood', roles)] });
    }
  });
};

async function updateSignupsJob(channel) {
  // message is only needed once
  const signupMessages = await channel.messages.fetch({ limit: 1, cache: false });
  const signupMessage = signupMessages.first();
  const embed = signupMessage ? signupMessage.embeds[0] : null;

  const job = schedule.scheduleJob('*/1 * * * *', async function () {
    const trny = getActiveTourney();
    // trny has ended or no #signup message
    if (!trny || !signupMessage || !embed) {
      console.log("updateSignupsJob() finished");
      job.cancel(false);
    }
    else { // update #signup embed
      const players = getTourneyPlayers(trny.id);
      let newEmbed = EmbedBuilder.from(embed);
      newEmbed = resetFields(newEmbed, trny.class, players.length);
      // sort each player into their respective embed division
      players.forEach((player) => {
        const foundIndex = embed.fields.findIndex((field) => field.name === player.division);
        const divFieldIndex = foundIndex !== -1 ? foundIndex : newEmbed.data.fields.length - 1;
        newEmbed = newEmbed.spliceFields(divFieldIndex, 1,
          {
            name: newEmbed.data.fields[divFieldIndex].name,
            value: newEmbed.data.fields[divFieldIndex].value += `${userMention(player.discord_id)} `
          }
        );
      });
      signupMessage.edit({ embeds: [newEmbed] });
    }
  });
}

async function updateSheetsJob() {
  const job = schedule.scheduleJob('*/1 * * * *', async function () {
    const trny = getActiveTourney();
    if (!trny) {
      console.log("updateSheetsJob() finished");
      job.cancel(false);
    }
    else {
      updateSheetTimes(trny);
    }
  });
}

module.exports = {
  startTourneyJob,
  endTourneyJob,
  updateSignupsJob,
  updateSheetsJob,
};