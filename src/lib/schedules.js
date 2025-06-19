const schedule = require('node-schedule');
const { EmbedBuilder, userMention, inlineCode } = require('discord.js');
const { getActiveTourney, getTourneyPlayers } = require('./database.js');
const { timesChannelIds, signupsChannelId } = require('./guild-ids.js');
const { createTourneySheet, updateSheetTimes } = require('./sheet.js');

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
  const job = schedule.scheduleJob(date, async function () {
    const trny = getActiveTourney();
    createTourneySheet(trny);
    updateSheetsJob();
    // send all times channels their division's map name
    channels.get(timesChannelIds.get('Platinum')).send(`🏁 A ${trny.class} tourney has started! Map: ${inlineCode(trny.plat_gold_map)}`);
    channels.get(timesChannelIds.get('Gold')).send(`🏁 A ${trny.class} tourney has started! Map: ${inlineCode(trny.plat_gold_map)}`);
    channels.get(timesChannelIds.get('Silver')).send(`🏁 A ${trny.class} tourney has started! Map: ${inlineCode(trny.silver_map)}`);
    channels.get(timesChannelIds.get('Bronze')).send(`🏁 A ${trny.class} tourney has started! Map: ${inlineCode(trny.bronze_map)}`);
    channels.get(timesChannelIds.get('Steel')).send(`🏁 A ${trny.class} tourney has started! Map: ${inlineCode(trny.wood_map)}`);
    if (trny.class === 'Soldier') {
      channels.get(timesChannelIds.get('Wood')).send(`🏁 A ${trny.class} tourney has started! Map: ${inlineCode(trny.wood_map)}`);
    }
  });
}

function endTourneyJob(datetime, channels, trny_class) {
  const date = new Date(datetime); // from sqlite datetime
  const job = schedule.scheduleJob(date, async function () {
    // delete signups message
    const signupMessage = await (await channels.get(signupsChannelId).messages.fetch({ limit: 1, cache: false })).values().next().value;
    signupMessage.delete();
    // send all times channels an end message. include fastest times in the future?
    const endMessageContent = '🏁 Tourney has ended! If you have a valid time to submit, please do so manually.';
    channels.get(timesChannelIds.get('Platinum')).send(endMessageContent);
    channels.get(timesChannelIds.get('Gold')).send(endMessageContent);
    channels.get(timesChannelIds.get('Silver')).send(endMessageContent);
    channels.get(timesChannelIds.get('Bronze')).send(endMessageContent);
    channels.get(timesChannelIds.get('Steel')).send(endMessageContent);
    if (trny_class === 'Soldier') {
      channels.get(timesChannelIds.get('Wood')).send(endMessageContent);
    }
  });
};

// should only be called when there is an active tourney (and therefore an active signups message)
async function updateSignupsJob(channel) {
  // don't need to get a new message every time
  const signupMessage = await (await channel.messages.fetch({ limit: 1, cache: false })).values().next().value;
  const embed = signupMessage.embeds[0];
  // every minute, update the embed.
  // if a tourney ends while this is running, delete the job
  const job = schedule.scheduleJob('*/1 * * * *', async function () {
    let newEmbed = EmbedBuilder.from(embed);
    const trny = getActiveTourney();
    if (trny === undefined) { // no active tourney
      job.cancel(false);
    }
    else { // update embed with all signed_up tournament players

      // sort each player into their respective embed division
      const players = getTourneyPlayers(trny.id);
      newEmbed = resetFields(newEmbed, trny.class, players.length);
      players.forEach((player) => {
        const foundIndex = embed.fields.findIndex((field) => field.name === player.division);
        const divFieldIndex = foundIndex !== -1 ? foundIndex : newEmbed.data.fields.length - 1;
        newEmbed = newEmbed.spliceFields(divFieldIndex, 1,
          {
            name: newEmbed.data.fields[divFieldIndex].name,
            value: newEmbed.data.fields[divFieldIndex].value += userMention(player.discord_id) + ' '
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
    if (trny === undefined) {
      job.cancel(false);
    }
    updateSheetTimes(trny);
  });
}

module.exports = {
  startTourneyJob,
  endTourneyJob,
  updateSignupsJob,
  updateSheetsJob,
};