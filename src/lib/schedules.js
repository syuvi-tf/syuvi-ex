import schedule from "node-schedule";
import { EmbedBuilder, userMention, TextChannel } from "discord.js";
import { getActiveTourney, getTourneyPlayers } from "./database.js";
import { timesChannelIds, signupsChannelId } from "./guild-ids.js";
import { createTourneySheet, updateSheetTimes } from "./sheet.js";
import { getMapEmbedByName, getTourneyTopTimesEmbed } from "./components.js";

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
 * @param {TextChannel} channel
 */
async function updateSignupsJob(channel) {
  // messages only needed once (if editing)

  const job = schedule.scheduleJob("* * * * *", async function () {
    const tourney = getActiveTourney();

    // tourney has ended
    // TODO(spiritov): what's the .length() check here for? (switched to .length since array)
    // removed .length check
    if (!tourney) {
      console.log("updateSignupsJob() finished");
      job.cancel(false);
      return;
    }

    // messages needed every time (if deleting and re-sending)
    const messageLimit = tourney.class === 'Soldier' ? 7 : 6;
    const signupMessages = (await channel.messages.fetch({ limit: messageLimit, cache: false })).filter((message) => message.author.bot);

    if (signupMessages.size !== (messageLimit)) { return; }

    signupMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const divisionMessages = Array.from(signupMessages.values());
    const divisionEmbeds = divisionMessages.map((message) => message.embeds[0]);

    const expectedEmbedCount = tourney.class === "Soldier" ? 7 : 6;
    if (divisionEmbeds.length !== expectedEmbedCount) {
      console.log(
        `ERROR: updateSignupsJob() expected ${expectedEmbedCount} embeds but got ${divisionEmbeds.length}`,
      );
      // TODO: do we cancel the job when this error occurs?
      return;
    }

    const divisions = ["Platinum", "Gold", "Silver", "Bronze", "Steel"];

    if (tourney.class === "Soldier") {
      divisions.push("Wood");
    }

    divisions.push("No Division");

    const editPromises = [];
    const players = getTourneyPlayers(tourney.id);
    const /** @type {{[x: string]: any[]}} */ playersByDivision = Object.groupBy(
      players,
      ({ division }) => (division ? division : "No Division"),
    );
    for (const divisionIdx in divisions) {
      const division = divisions[divisionIdx];
      const playersInDivision = playersByDivision[division];
      const playerMentions = playersInDivision
        ? playersInDivision
          .map((player) => userMention(player.discord_id))
          .join(" ")
        : "\u200b";

      const embed = EmbedBuilder.from(divisionEmbeds[divisionIdx]).setDescription(playerMentions);

      editPromises.push(divisionMessages[divisionIdx].delete());
      await channel.send({ embeds: [embed] });
    }

    // TODO: await editPromises & process errors
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
