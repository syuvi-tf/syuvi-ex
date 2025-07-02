import schedule from "node-schedule";
import { EmbedBuilder, inlineCode, TextChannel } from "discord.js";
import {
  addTourneySignupMessage,
  getActiveTourney,
  getTourneyPlayers,
  getTourneySignupMessage,
} from "./database.js";
import { timesChannelIds, signupsChannelId } from "./guild-ids.js";
import { createTourneySheet, updateSheetTimes } from "./sheet.js";
import {
  getEmptyDivisionEmbeds,
  getMapEmbedByName,
  getTourneyTopTimesEmbed,
} from "./components.js";
import { getDivisionNames } from "./shared-functions.js";

function startTourneyJob(datetime, channels) {
  const date = new Date(datetime); // from sqlite datetime
  schedule.scheduleJob(date, async function () {
    console.log("tried to start a tourney!");
    const tourney = getActiveTourney();
    createTourneySheet(tourney);
    updateSheetsJob();
    // send all times channels their division's map embed
    channels.get(timesChannelIds.get("Platinum")).send({
      content: `🏁 A ${tourney.class} tourney has started! The map is..`,
      embeds: [await getMapEmbedByName(tourney.plat_gold_map)],
    });
    channels.get(timesChannelIds.get("Gold")).send({
      content: `🏁 A ${tourney.class} tourney has started! The map is..`,
      embeds: [await getMapEmbedByName(tourney.plat_gold_map)],
    });
    channels.get(timesChannelIds.get("Silver")).send({
      content: `🏁 A ${tourney.class} tourney has started! The map is..`,
      embeds: [await getMapEmbedByName(tourney.silver_map)],
    });
    channels.get(timesChannelIds.get("Bronze")).send({
      content: `🏁 A ${tourney.class} tourney has started! The map is..`,
      embeds: [await getMapEmbedByName(tourney.bronze_map)],
    });
    channels.get(timesChannelIds.get("Steel")).send({
      content: `🏁 A ${tourney.class} tourney has started! The map is..`,
      embeds: [await getMapEmbedByName(tourney.steel_map)],
    });
    if (tourney.class === "Soldier") {
      channels.get(timesChannelIds.get("Wood")).send({
        content: `🏁 A ${tourney.class} tourney has started! The map is..`,
        embeds: [await getMapEmbedByName(tourney.wood_map)],
      });
    }
  });
}

function endTourneyJob(datetime, channels, tourney) {
  const date = new Date(datetime); // from sqlite datetime
  schedule.scheduleJob(date, async function () {
    // update sheets one more time
    updateSheetTimes(tourney);
    console.log("tried to end a tourney!");
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
    channels.get(timesChannelIds.get("Platinum")).send({
      content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`,
      embeds: [getTourneyTopTimesEmbed(tourney, "Platinum", roles)],
    });
    channels.get(timesChannelIds.get("Gold")).send({
      content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`,
      embeds: [getTourneyTopTimesEmbed(tourney, "Gold", roles)],
    });
    channels.get(timesChannelIds.get("Silver")).send({
      content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`,
      embeds: [getTourneyTopTimesEmbed(tourney, "Silver", roles)],
    });
    channels.get(timesChannelIds.get("Bronze")).send({
      content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`,
      embeds: [getTourneyTopTimesEmbed(tourney, "Bronze", roles)],
    });
    channels.get(timesChannelIds.get("Steel")).send({
      content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`,
      embeds: [getTourneyTopTimesEmbed(tourney, "Steel", roles)],
    });
    if (tourney.class === "Soldier") {
      channels.get(timesChannelIds.get("Wood")).send({
        content: `🏁 Tourney has ended! If you have a valid time to submit, please do so manually.`,
        embeds: [getTourneyTopTimesEmbed(tourney, "Wood", roles)],
      });
    }
  });
}

/**
 *
 * @param {string} tournamentId
 * @param {string} firstMessageId
 * @returns {string | undefined}
 */
function getOrInsertTourneySignupMessage(tournamentId, firstMessageId) {
  const tourneySignupMessage = getTourneySignupMessage(tournamentId);
  if (tourneySignupMessage === undefined) {
    try {
      addTourneySignupMessage(tournamentId, firstMessageId);
    } catch {
      return undefined;
    }

    return firstMessageId;
  }

  return tourneySignupMessage.discord_id;
}

/**
 * Deletes every message in the specified channel, except for the signup message associated with the
 * active tournament. If there aren't any associated, it'll find the earliest message in the channel
 * and use it as the associated message.
 * @param {TextChannel} channel
 */
async function updateSignupsJob(channel) {
  // messages only needed once (if editing)

  // roles only needed once
  const roles = channel.guild.roles.cache;

  // TODO(spiritov): check if any tourney players have updated_at before updating..
  const job = schedule.scheduleJob("* * * * *", async function () {
    const tourney = getActiveTourney();

    // tourney has ended
    if (!tourney) {
      console.log("updateSignupsJob() finished");
      job.cancel(false);
      return;
    }

    let allSignupMessages = await channel.messages.fetch({ limit: 100 });

    // early return so a message can prevent signup updates
    if (allSignupMessages.some((message) => !message.author.bot)) {
      return;
    }

    if (allSignupMessages.length === 0) {
      console.log(
        "ERROR: couldn't complete updateSignupsJob, there are no bot-authored messages in the signups channel.",
      );
      return;
    }

    allSignupMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const initialSignupMessageId = getOrInsertTourneySignupMessage(
      tourney.id,
      allSignupMessages.first().id,
    );
    if (initialSignupMessageId === undefined) {
      console.log(
        `ERROR: couldn't complete getOrInsertTourneySignupMessage(${tourney.id}, ${allSignupMessages.first().id}), insert failed`,
      );
      return;
    }

    const messagesToDelete = allSignupMessages.filter(
      (message) => message.id !== initialSignupMessageId,
    );
    await channel.bulkDelete(messagesToDelete);

    const players = getTourneyPlayers(tourney.id);
    /** @type {{[x: string]: any[]}} */
    const playersByDivision = Object.groupBy(players, ({ division }) =>
      division ? division : "No Division",
    );
    const divisions = getDivisionNames(tourney.class);
    const divisionEmbeds = getEmptyDivisionEmbeds(tourney.class, roles);
    for (const [divisionIdx, divisionEmbed] of divisionEmbeds.entries()) {
      const division = divisions[divisionIdx];
      const playersInDivision = playersByDivision[division];
      const playerMentions = playersInDivision
        ? inlineCode(playersInDivision.map((player) => player.display_name).join(", "))
        : "\u200b";
      const embed = EmbedBuilder.from(divisionEmbed).setDescription(playerMentions);
      await channel.send({ embeds: [embed] });
    }
  });
}

async function updateSheetsJob() {
  const job = schedule.scheduleJob("*/1 * * * *", async function () {
    const tourney = getActiveTourney();
    if (!tourney) {
      console.log("updateSheetsJob() finished");
      job.cancel(false);
    } else {
      updateSheetTimes(tourney);
    }
  });
}

export { startTourneyJob, endTourneyJob, updateSignupsJob, updateSheetsJob };
