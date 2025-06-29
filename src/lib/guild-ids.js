let guildId;
let clientId;
let divisionRoleIds;
let signupsChannelId;
let faqChannelId;
let timesChannelIds;

if (process.env.FLY_APP_NAME) {
  guildId = "1322534308413444220";
  clientId = "1364377893802872914";
  divisionRoleIds = new Map([
    ['Platinum Soldier', '1322534308510040092'],
    ['Gold Soldier', '1322534308510040090'],
    ['Silver Soldier', '1322534308510040088'],
    ['Bronze Soldier', '1322534308510040086'],
    ['Steel Soldier', '1322534308510040084'],
    ['Wood Soldier', '1364256052844957727'],
    ['Platinum Demo', '1322534308510040093'],
    ['Gold Demo', '1322534308510040091'],
    ['Silver Demo', '1322534308510040089'],
    ['Bronze Demo', '1322534308510040087'],
    ['Steel Demo', '1322534308510040085'],
    ['Wood Demo', '1386903954599710841'],
  ]);

  signupsChannelId = '1322534310397345828';
  faqChannelId = '1322534310150017051';
  timesChannelIds = new Map([
    ['Platinum', '1322534310720438286'],
    ['Gold', '1322534310720438287'],
    ['Silver', '1322534310720438288'],
    ['Bronze', '1322534310720438289'],
    ['Steel', '1379226390976790608'],
    ['Wood', '1370723797614723182'],
  ]);
} else {
  guildId = "1364381421208207482";
  clientId = "1386902732660805774"; // TODO: UPDATE WITH SYUVI-TEST CLIENT ID!!!!
  divisionRoleIds = new Map([
    ['Platinum Soldier', '1365102656040734761'],
    ['Gold Soldier', '1365102716283650151'],
    ['Silver Soldier', '1365102762832171171'],
    ['Bronze Soldier', '1365102816955207821'],
    ['Steel Soldier', '1365103400685142208'],
    ['Wood Soldier', '1365102906709250059'],
    ['Platinum Demo', '1365103026808819712'],
    ['Gold Demo', '1365103174016565279'],
    ['Silver Demo', '1365103197219455047'],
    ['Bronze Demo', '1365103224276910090'],
    ['Steel Demo', '1365103360587464824'],
    ['Wood Demo', '1365116741847613590'],
  ]);

  signupsChannelId = '1365091870341857310';
  faqChannelId = '1373060351414894593';
  timesChannelIds = new Map([
    ['Platinum', '1365091916982652978'],
    ['Gold', '1365091938201636865'],
    ['Silver', '1365091952697282591'],
    ['Bronze', '1365091965833576520'],
    ['Steel', '1379226390976790608'],
    ['Wood', '1379226402708263042'],
  ]);
}

export {
  guildId,
  clientId,
  divisionRoleIds,
  signupsChannelId,
  faqChannelId,
  timesChannelIds
}
