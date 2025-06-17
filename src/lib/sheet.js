const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const dotenv = require('dotenv');
const { getBestTourneyTimes } = require('./database.js');

dotenv.config();
const jwt = new JWT({
  email: process.env.SHEETS_CLIENT_EMAIL,
  key: process.env.SHEETS_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const doc = new GoogleSpreadsheet(process.env.SHEETS_SPREADSHEET_ID, jwt);

// relies on sheets named 'Soldier Template' and 'Demo Template' to exist
async function getTemplate(trny_class) {
  await doc.loadInfo();
  return doc.sheetsByTitle[`${trny_class} Template`];
}

// used to get a 'Month' 'Year' tournament
async function getSheetByName(name) {
  await doc.loadInfo();
  return doc.sheetsByTitle[name];
}

// not used
async function getSheets() {
  await doc.loadInfo(); // loads document properties and worksheets
  const sheets = doc.sheetsByIndex; // or use `doc.sheetsById[id]` or `doc.sheetsByTitle[title]`
  return sheets;
}

function formatRunTime(time, verified) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time) - (minutes * 60);
  const ms = parseInt((time % 1).toFixed(2) * 100);
  return `${verified ? '' : '❔ '}${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}.${ms}`;
}

async function updateRows(rows, times) {
  let maxRows = Math.max(...[times.platinum.length, times.gold.length, times.silver.length, times.bronze.length, times.steel.length, times.wood.length]);
  for (let i = 0; i < times.platinum.length; i++) {
    const time = times.platinum[i];
    const row = rows[i];
    row.assign({ plat_player: time.display_name, plat_time: time.run_time });
  }
  for (let i = 0; i < times.gold.length; i++) {
    const time = times.gold[i];
    const row = rows[i];
    row.assign({ gold_player: time.display_name, gold_time: time.run_time });
  }
  for (let i = 0; i < times.silver.length; i++) {
    const time = times.silver[i];
    const row = rows[i];
    row.assign({ silver_player: time.display_name, silver_time: time.run_time });
  }
  for (let i = 0; i < times.bronze.length; i++) {
    const time = times.bronze[i];
    const row = rows[i];
    row.assign({ bronze_player: time.display_name, bronze_time: time.run_time });
  }
  for (let i = 0; i < times.steel.length; i++) {
    const time = times.steel[i];
    const row = rows[i];
    row.assign({ steel_player: time.display_name, steel_time: time.run_time });
  }
  for (let i = 0; i < times.wood.length; i++) {
    const time = times.wood[i];
    const row = rows[i];
    row.assign({ wood_player: time.display_name, wood_time: time.run_time });
  }
  for (let i = 0; i < maxRows; i++) {
    await rows[i].save();
  }
}

async function createTourneySheet(trny) {
  const templateSheet = await getTemplate(trny.class);
  const trny_date = new Date(trny.starts_at);
  const monthAndYear = trny_date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  // duplicate sheet from soldier / demo template
  await templateSheet.duplicate({ title: monthAndYear });

  // populate month/year in header, maps per division
  const sheet = await getSheetByName(monthAndYear);
  await sheet.loadCells('B3:M3');
  await sheet.loadCells('B1:M1');
  const titleCell = sheet.getCellByA1('B1');
  titleCell.value = `${trny.class} Tournament Standings (${trny_date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
  const mapCells = {
    platinum: sheet.getCellByA1('B3'),
    gold: sheet.getCellByA1('D3'),
    silver: sheet.getCellByA1('F3'),
    bronze: sheet.getCellByA1('H3'),
    steel: sheet.getCellByA1('J3'),
    wood: sheet.getCellByA1('L3'),
  };
  mapCells.platinum.value = trny.plat_gold_map;
  mapCells.gold.value = trny.plat_gold_map;
  mapCells.silver.value = trny.silver_map;
  mapCells.bronze.value = trny.bronze_map;
  mapCells.steel.value = trny.steel_map;
  if (trny.class === 'Soldier') {
    mapCells.wood.value = trny.wood_map;
  }
  await sheet.saveUpdatedCells();
  sheet.loadHeaderRow(6); // header row is always 6
  updateSheetTimes(trny);
}

async function updateSheetTimes(trny) {
  const dbTimes = getBestTourneyTimes(trny.id);
  const trny_date = new Date(trny.starts_at);
  const monthAndYear = trny_date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  // get current tourney's sheet
  const sheet = await getSheetByName(monthAndYear);
  const rows = await sheet.getRows();
  // sort and format dbTimes
  const times = {
    platinum: dbTimes.filter((time) => time.division === 'Platinum')
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) => Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) })),
    gold: dbTimes.filter((time) => time.division === 'Gold')
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) => Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) })),
    silver: dbTimes.filter((time) => time.division === 'Silver')
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) => Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) })),
    bronze: dbTimes.filter((time) => time.division === 'Bronze')
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) => Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) })),
    steel: dbTimes.filter((time) => time.division === 'Steel')
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) => Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) })),
    wood: dbTimes.filter((time) => time.division === 'Wood')
      .sort((a, b) => a.run_time - b.run_time)
      .map((time) => Object.assign(time, { run_time: formatRunTime(time.run_time, time.verified) })),
  }
  await updateRows(rows, times);
}

module.exports = {
  createTourneySheet,
  updateSheetTimes
};