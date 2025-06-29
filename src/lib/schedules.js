import schedule from "node-schedule";
import { EmbedBuilder, userMention, TextChannel } from "discord.js";
import { getActiveTourney, getTourneyPlayers } from "./database.js";
import { timesChannelIds, signupsChannelId } from "./guild-ids.js";
import { createTourneySheet, updateSheetTimes } from "./sheet.js";
import { getMapEmbedByName, getTourneyTopTimesEmbed } from "./components.js";

function resetFields(newEmbed, tourneyclass, num_players) {
  newEmbed.setFields(
    { name: "Platinum", value: "\u200b" },
    { name: "Gold", value: "\u200b" },
    { name: "Silver", value: "\u200b" },
    { name: "Bronze", value: "\u200b" },
    { name: "Steel", value: "\u200b" },
  );
  if (tourneyclass === "Soldier") {
    newEmbed.addFields({ name: "Wood", value: "\u200b" });
  }
  newEmbed.addFields({ name: "No Division", value: "\u200b" });
  newEmbed.setFooter({ text: `updates every minute (${num_players} signups)` });
  return newEmbed;
}

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
  // message is only needed once
  const signupMessages = await channel.messages.fetch({ limit: 1, cache: false });
  const signupMessage = signupMessages.first();
  const embed = signupMessage ? signupMessage.embeds[0] : null;

  const job = schedule.scheduleJob("* * * * *", async function () {
    const tourney = getActiveTourney();

    // tourney has ended or no #signup message
    if (!tourney || !signupMessage || !embed) {
      console.log("updateSignupsJob() finished");
      job.cancel(false);
      return;
    }

    // update #signup embed
    const players = getTourneyPlayers(tourney.id);
    let newEmbed = EmbedBuilder.from(embed);
    newEmbed = resetFields(newEmbed, tourney.class, players.length);

    // sort each player into their respective embed division
    const playersByDivision = Object.groupBy(players, ({ division }) => division);
    for (const division in playersByDivision) {
      let divisionFieldIdx = embed.fields.findIndex(({ name }) => division === name);
      if (divisionFieldIdx === -1) {
        divisionFieldIdx = newEmbed.data.fields.length - 1;
      }

      for (const player of playersByDivision[division]) {
        const field = newEmbed.data.fields[divisionFieldIdx];
        newEmbed = newEmbed.spliceFields(divisionFieldIdx, 1, {
          name: field.name,
          value: field.value + `${userMention(player.discord_id)} `,
        });
      }
    }

    signupMessage.edit({ embeds: [newEmbed] });
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
