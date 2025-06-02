const schedule = require('node-schedule');
const { EmbedBuilder, userMention } = require('discord.js');
const { getActiveTourney, getTourneyPlayers } = require('./database.js');

// rename these
function startTourneyJob(datetime) {
  const date = new Date(datetime); // from sqlite datetime
  const job = schedule.scheduleJob(date, function () {
    console.log('tourney started');
  });
}

function endTourneyJob(datetime) {
  const date = new Date(datetime); // from sqlite datetime
  const job = schedule.scheduleJob(date, function () {
    console.log('tourney ended');
  });
}

// should only be called when there is an active tourney (and therefore an active signups message)
async function updateSignupsJob(channel) {
  // don't need to get a new message every time
  const signupMessage = (await channel.messages.fetch({ limit: 1, cache: false })).values().next().value;
  const embed = signupMessage.embeds[0];
  // every 5 minutes, update the embed.
  // if a tourney ends while this is running, delete the job
  const job = schedule.scheduleJob('*/1 * * * *', async function () {
    let newEmbed = EmbedBuilder.from(embed);
    const trny = getActiveTourney();
    if (trny === undefined) { // no active tourney
      job.cancel();
    }
    else { // update embed with all signed_up tournament players
      newEmbed.setFields(
        { name: 'Platinum', value: '\u200b' },
        { name: 'Gold', value: '\u200b' },
        { name: 'Silver', value: '\u200b' },
        { name: 'Bronze', value: '\u200b' },
        { name: 'Steel', value: '\u200b' },
      );
      if (trny.class === 'Soldier') {
        newEmbed.addFields({ name: 'Wood', value: '\u200b' });
      }
      newEmbed.addFields({ name: 'No Division', value: '\u200b' });

      // sort each player into their respective embed division
      const players = getTourneyPlayers(trny.id);
      players.forEach((player) => {
        const foundIndex = embed.fields.findIndex((field) => field.name === player.division);
        const divFieldIndex = foundIndex !== -1 ? foundIndex : newEmbed.data.fields.length - 1;
        newEmbed = newEmbed.spliceFields(divFieldIndex, 1,
          {
            name: newEmbed.data.fields[divFieldIndex].name,
            value: newEmbed.data.fields[divFieldIndex].value += userMention(player.discord_id)
          }
        );
      });
      signupMessage.edit({ embeds: [newEmbed] });
    }
  });
}

module.exports = {
  startTourneyJob,
  endTourneyJob,
  updateSignupsJob,
};