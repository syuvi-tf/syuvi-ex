import dotenv from "dotenv";
import { JWT } from "google-auth-library";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { getBestTourneyTimes } from "./database.js";

dotenv.config();

const jwt = new JWT({
  email: process.env.SHEETS_CLIENT_EMAIL,
  key: process.env.SHEETS_PRIVATE_KEY.split(String.raw`\n`).join("\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const doc = new GoogleSpreadsheet(process.env.SHEETS_SPREADSHEET_ID, jwt);

// relies on sheets named 'Soldier Template' and 'Demo Template' to exist
async function getTemplate(tourney_class) {
  await doc.loadInfo();
  return doc.sheetsByTitle[`${tourney_class} Template`];
}

// used to get a 'Month' 'Year' tournament
async function getSheetByName(name) {
  await doc.loadInfo();
  return doc.sheetsByTitle[name];
}

function formatRunTime(time, verified) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time) - minutes * 60;
  const ms = parseInt((time % 1).toFixed(2) * 100);
  return `${verified ? "" : "❔ "}${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}.${ms < 10 ? `0${ms}` : ms}`;
}

async function updateRows(rows, times) {
  let maxRows = Math.max(
    ...[
      times.platinum.length,
      times.gold.length,
      times.silver.length,
      times.bronze.length,
      times.steel.length,
      times.wood.length,
    ],
  );
  for (let i = 0; i < times.platinum.length; i++) {
    const time = times.platinum[i];
    const row = rows[i];
    row.assign({ plat_player: `'${time.display_name}`, plat_time: time.run_time });
  }
  for (let i = 0; i < times.gold.length; i++) {
    const time = times.gold[i];
    const row = rows[i];
    row.assign({ gold_player: `'${time.display_name}`, gold_time: time.run_time });
  }
  for (let i = 0; i < times.silver.length; i++) {
    const time = times.silver[i];
    const row = rows[i];
    row.assign({ silver_player: `'${time.display_name}`, silver_time: time.run_time });
  }
  for (let i = 0; i < times.bronze.length; i++) {
    const time = times.bronze[i];
    const row = rows[i];
    row.assign({ bronze_player: `'${time.display_name}`, bronze_time: time.run_time });
  }
  for (let i = 0; i < times.steel.length; i++) {
    const time = times.steel[i];
    const row = rows[i];
    row.assign({ steel_player: `'${time.display_name}`, steel_time: time.run_time });
  }
  for (let i = 0; i < times.wood.length; i++) {
    const time = times.wood[i];
    const row = rows[i];
    row.assign({ wood_player: `'${time.display_name}`, wood_time: time.run_time });
  }
  for (let i = 0; i < maxRows; i++) {
    await rows[i].save();
  }
}

async function createTourneySheet(tourney) {
  console.log("trying to create a new tourney sheet..");
  const templateSheet = await getTemplate(tourney.class);
  const tourney_date = new Date(tourney.starts_at);
  const monthAndYear = tourney_date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  // duplicate sheet from soldier / demo template
  await templateSheet.duplicate({ title: monthAndYear });

  // populate month/year in header, maps per division
  const sheet = await getSheetByName(monthAndYear);
  await sheet.updateProperties({ hidden: false });
  await sheet.loadCells("B3:M3");
  await sheet.loadCells("B1:M1");
  await sheet.loadCells("A57:B57");
  const titleCell = sheet.getCellByA1("B1");
  const tourney_idCell = sheet.getCellByA1("A57");
  titleCell.value = `${tourney.class} Tournament Standings (${tourney_date.toLocaleDateString("en-US", { month: "long", year: "numeric" })})`;
  tourney_idCell.value = `Tourney ID: ${tourney.id}`;
  const mapCells = {
    platinum: sheet.getCellByA1("B3"),
    gold: sheet.getCellByA1("D3"),
    silver: sheet.getCellByA1("F3"),
    bronze: sheet.getCellByA1("H3"),
    steel: sheet.getCellByA1("J3"),
    wood: sheet.getCellByA1("L3"),
  };
  mapCells.platinum.value = tourney.plat_gold_map;
  mapCells.gold.value = tourney.plat_gold_map;
  mapCells.silver.value = tourney.silver_map;
  mapCells.bronze.value = tourney.bronze_map;
  mapCells.steel.value = tourney.steel_map;
  if (tourney.class === "Soldier") {
    mapCells.wood.value = tourney.wood_map;
  }
  await sheet.saveUpdatedCells();
  sheet.loadHeaderRow(6); // header row is always 6
  updateSheetTimes(tourney);
}

async function updateSheetTimes(tourney) {
  const dbTimes = getBestTourneyTimes(tourney.id);
  const tourney_date = new Date(tourney.starts_at);
  const monthAndYear = tourney_date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  // get current tourney's sheet
  const sheet = await getSheetByName(monthAndYear);
  sheet.loadHeaderRow(6);
  const rows = await sheet.getRows();
  // sort and format dbTimes
  const times = {
    platinum: dbTimes
      .filter((time) => time.division === "Platinum")
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) =>
        Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) }),
      ),
    gold: dbTimes
      .filter((time) => time.division === "Gold")
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) =>
        Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) }),
      ),
    silver: dbTimes
      .filter((time) => time.division === "Silver")
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) =>
        Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) }),
      ),
    bronze: dbTimes
      .filter((time) => time.division === "Bronze")
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) =>
        Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) }),
      ),
    steel: dbTimes
      .filter((time) => time.division === "Steel")
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) =>
        Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) }),
      ),
    wood: dbTimes
      .filter((time) => time.division === "Wood")
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) =>
        Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) }),
      ),
  };
  await updateRows(rows, times);
}

export { createTourneySheet, updateSheetTimes };
