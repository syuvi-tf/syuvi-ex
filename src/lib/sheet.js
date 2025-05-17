const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const dotenv = require('dotenv');

//skeleton

dotenv.config();
const jwt = new JWT({
  email: process.env.SHEETS_CLIENT_EMAIL,
  key: process.env.SHEETS_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const doc = new GoogleSpreadsheet(process.env.SHEETS_SPREADSHEET_ID, jwt);

async function testSheet() {
  await doc.loadInfo(); // loads document properties and worksheets
  console.log(doc.title);
  //await doc.updateProperties({ title: 'renamed doc' });

  const sheet = doc.sheetsByIndex[0]; // or use `doc.sheetsById[id]` or `doc.sheetsByTitle[title]`
  console.log(`Current Sheet: ${sheet.title}`);
  console.log(`Row Count: ${sheet.rowCount}`);

  // adding / removing sheets
  //const newSheet = await doc.addSheet({ title: 'another sheet' });
  //await newSheet.delete();
}

testSheet();