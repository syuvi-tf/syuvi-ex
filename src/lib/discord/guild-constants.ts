let userID: string;
let guildID: string;
let signupChannelID: string;
let faqChannelID: string;
let timeChannelIDs: Map<string, string>;
let roleIDs: Map<string, string>;

if (process.env.FLY_APP_NAME === 'syuvi') {
  // production IDs
  userID = '1364377893802872914';
  guildID = '1403854931856851135';
  signupChannelID = '1322534310397345828';
  faqChannelID = '1322534310150017051';

  timeChannelIDs = new Map([
    ['Platinum', '1322534310720438286'],
    ['Gold', '1322534310720438287'],
    ['Silver', '1322534310720438288'],
    ['Bronze', '1322534310720438289'],
    ['Steel', '1379226390976790608'],
    ['Wood', '1370723797614723182'],
  ]);

  roleIDs = new Map([
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
} else {
  // test IDs
  userID = '1403855190809120888';
  guildID = '1403854931856851135';
  signupChannelID = '1406794337198673971';
  faqChannelID = '1406794223587430540';

  timeChannelIDs = new Map([
    ['Platinum', '1406794443356508180'],
    ['Gold', '1406794503473594438'],
    ['Silver', '1406794514764664924'],
    ['Bronze', '1406794527926255668'],
    ['Steel', '1406794538806415422'],
    ['Wood', '1406794548813762660'],
  ]);

  roleIDs = new Map([
    ['Platinum Soldier', '1406794778342854756'],
    ['Gold Soldier', '1406794815428890634'],
    ['Silver Soldier', '1406794847066521630'],
    ['Bronze Soldier', '1406794862644428831'],
    ['Steel Soldier', '1406794889471197194'],
    ['Wood Soldier', '1406795037802627135'],
    ['Platinum Demo', '1406794912145346721'],
    ['Gold Demo', '1406794930470260766'],
    ['Silver Demo', '1406794942784864266'],
    ['Bronze Demo', '1406794958857568296'],
    ['Steel Demo', '1406794987424710746'],
    ['Wood Demo', '1406795007037411368'],
  ]);
}

export default { userID, guildID, signupChannelID, faqChannelID, timeChannelIDs, roleIDs };
