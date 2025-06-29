import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  userMention,
  inlineCode,
  roleMention,
  EmbedBuilder,
  hyperlink,
} from "discord.js"
import { divisionRoleIds } from "./guild-ids.js"
import { getTourneyDivisionTopTimes } from "./database.js"
import { formatTime, formatSteamURL, getTourneyMap } from "./shared-functions.js"

const confirmRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("confirm").setLabel("confirm").setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId("cancel").setLabel("cancel").setStyle(ButtonStyle.Secondary),
)

function getInlineCodeTopTimes(toptimes) {
  let inlines = ``
  for (let i = 0; i < toptimes.length; i++) {
    inlines += `${inlineCode(`${i + 1} | ${toptimes[i].run_time}`)} ${userMention(toptimes[i].discord_id)}
`
  }
  return inlines
}

function getTourneyTopTimesEmbed(trny, division_name, roles) {
  const division_color = roles.cache.get(
    divisionRoleIds.get(`${division_name} ${trny.class}`),
  ).color
  const db_toptimes = getTourneyDivisionTopTimes(trny.id, division_name)
  const toptimes = db_toptimes.map((time) =>
    Object.assign(time, { run_time: formatTime(time.run_time, time.verified) }),
  )
  const embed = new EmbedBuilder().setColor(division_color)
    .setDescription(`### ${roleMention(divisionRoleIds.get(`${division_name} ${trny.class}`))} Top 8
> ${getTourneyMap(trny, division_name)}
${getInlineCodeTopTimes(toptimes)}`)
  return embed
}

function getMapSelectModal(tourneyClass) {
  const modal = new ModalBuilder().setCustomId("mapSelect").setTitle(`${tourneyClass} Tourney Maps`)
  const platGoldMap = new TextInputBuilder()
    .setCustomId("plat_gold_map")
    .setLabel("Platinum / Gold Map")
    .setStyle(TextInputStyle.Short)
  const silverMap = new TextInputBuilder()
    .setCustomId("silver_map")
    .setLabel("Silver Map")
    .setStyle(TextInputStyle.Short)
  const bronzeMap = new TextInputBuilder()
    .setCustomId("bronze_map")
    .setLabel("Bronze Map")
    .setStyle(TextInputStyle.Short)
  const steelMap = new TextInputBuilder()
    .setCustomId("steel_map")
    .setLabel("Steel Map")
    .setStyle(TextInputStyle.Short)
  const woodMap = new TextInputBuilder()
    .setCustomId("wood_map")
    .setLabel("Wood Map")
    .setStyle(TextInputStyle.Short)

  const platGoldMapRow = new ActionRowBuilder().addComponents(platGoldMap)
  const silverMapRow = new ActionRowBuilder().addComponents(silverMap)
  const bronzeMapRow = new ActionRowBuilder().addComponents(bronzeMap)
  const steelMapRow = new ActionRowBuilder().addComponents(steelMap)
  const woodMapRow = new ActionRowBuilder().addComponents(woodMap)
  modal.addComponents(platGoldMapRow, silverMapRow, bronzeMapRow, steelMapRow)
  if (tourneyClass === "Soldier") {
    modal.addComponents(woodMapRow) // wood only applies to soldier
  }
  return modal
}

async function getMapEmbed(mapId) {
  const map = await (
    await fetch(`https://tempus2.xyz/api/v0/maps/id/${mapId}/fullOverview2`)
  ).json()
  const map_name = map.map_info.name
  const author = map.authors.length > 1 ? "Multiple Authors" : map.authors[0].name
  const embed = new EmbedBuilder()
    .setColor("A69ED7")
    .setTitle(map_name)
    .setURL(`https://tempus2.xyz/maps/${map_name}`)
    .setImage(
      `https://raw.githubusercontent.com/wfzq/Tempus-Tracker/refs/heads/master/src/data/thumbnails/${map_name}.jpg`,
    )
    .setDescription(`> By ${author}`)
    .addFields(
      {
        name: "Soldier",
        value: `Tier ${map.tier_info.soldier}, Rating ${map.rating_info.soldier}
Record: ${map.soldier_runs.length > 0 ? formatTime(map.soldier_runs[0].duration, true) : "No completions."}`,
        inline: true,
      },
      {
        name: "Demo",
        value: `Tier ${map.rating_info.demoman}, Rating ${map.rating_info.demoman}
Record: ${map.demoman_runs.length > 0 ? formatTime(map.demoman_runs[0].duration, true) : "No completions."}`,
        inline: true,
      },
    )
  return embed
}

// re-uses getMapEmbed(), but results in one less Tempus API call (good courtesy?)
async function getMapEmbedByName(map_name) {
  const map = await (
    await fetch(`https://tempus2.xyz/api/v0/maps/name/${map_name}/fullOverview2`)
  ).json()
  const author = map.authors.length > 1 ? "Multiple Authors" : map.authors[0].name
  const embed = new EmbedBuilder()
    .setColor("A69ED7")
    .setTitle(map_name)
    .setURL(`https://tempus2.xyz/maps/${map_name}`)
    .setImage(
      `https://raw.githubusercontent.com/wfzq/Tempus-Tracker/refs/heads/master/src/data/thumbnails/${map_name}.jpg`,
    )
    .setDescription(`> By ${author}`)
    .addFields(
      {
        name: "Soldier",
        value: `Tier ${map.tier_info.soldier}, Rating ${map.rating_info.soldier}
Record: ${map.soldier_runs.length > 0 ? formatTime(map.soldier_runs[0].duration, true) : "No completions."}`,
        inline: true,
      },
      {
        name: "Demo",
        value: `Tier ${map.rating_info.demoman}, Rating ${map.rating_info.demoman}
Record: ${map.demoman_runs.length > 0 ? formatTime(map.demoman_runs[0].duration, true) : "No completions."}`,
        inline: true,
      },
    )
  return embed
}

function getPlayerEmbed(user, player) {
  const embed = new EmbedBuilder()
    .setColor("A69ED7")
    .setThumbnail(user.avatarURL())
    .setDescription(`### Player Info for ${userMention(user.id)}`)
    .addFields(
      { name: "Display Name", value: `${inlineCode(player.display_name)}`, inline: true },
      {
        name: "Divisions",
        value: `${player.soldier_division ? roleMention(divisionRoleIds.get(player.soldier_division + " Soldier")) : `${inlineCode("No Soldier Division")}`}
${player.demo_division ? roleMention(divisionRoleIds.get(player.demo_division + " Demo")) : `${inlineCode("No Demo Division")}`}`,
        inline: true,
      },
      {
        name: "Profiles",
        value: `${
          player.tempus_id
            ? `${hyperlink("Tempus", `https://tempus2.xyz/players/${player.tempus_id}`)}
${hyperlink("Steam", formatSteamURL(player.steam_id))}`
            : `${inlineCode("No Linked Tempus ID")}`
        }`,
      },
    )
  return embed
}

export {
  confirmRow,
  getTourneyTopTimesEmbed,
  getMapSelectModal,
  getPlayerEmbed,
  getMapEmbed,
  getMapEmbedByName,
}
