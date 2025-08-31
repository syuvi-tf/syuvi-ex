## roadmap
development plans are tracked through this repo's Projects View! general info for each project is available in their respective "Project details" pane.

currently, development will progress through..
- [automated competitions](https://github.com/orgs/syuvi-tf/projects/6?pane=info)
- [website](https://github.com/orgs/syuvi-tf/projects/8?pane=info)
- [prize distribution bot](https://github.com/orgs/syuvi-tf/projects/9?pane=info)

## development

install dependencies..

```console
npm i
```

populate `.env`..
```env
DISCORD_TOKEN="Discord App token"
SHEETS_CLIENT_EMAIL="GCP/Google Services client email"
SHEETS_PRIVATE_KEY="GCP/Google Services private key"
SHEETS_SPREADSHEET_ID="Google Spreadsheet id to render tournament sheets to"
```

run locally..

```console
npm run syuvi
```

reload commands after adding or removing them..

```console
npm run commands
```
