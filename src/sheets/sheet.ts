import dotenv from 'dotenv';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';

dotenv.config();

// TODO: something besides setting 'null' string in the future
const jwt = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL ?? 'null',
  key: (process.env.GOOGLE_SHEETS_PRIVATE_KEY ?? 'null').split(String.raw`\n`).join('\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? 'null', jwt);
console.log(doc);
