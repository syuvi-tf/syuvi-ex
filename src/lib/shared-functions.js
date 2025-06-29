function formatSteamURL(steam_id32) {
  const Y = parseInt(steam_id32.charAt(steam_id32.indexOf(":") + 1));
  const W = parseInt(steam_id32.substring(steam_id32.lastIndexOf(":") + 1)) * 2 + Y;
  const steam_url = `https://steamcommunity.com/profiles/[U:1:${W}]`;
  return steam_url;
}

function getTourneyMap(trny, division) {
  switch (division) {
    case "Platinum":
    case "Gold":
      return trny.plat_gold_map;
    case "Silver":
      return trny.silver_map;
    case "Bronze":
      return trny.bronze_map;
    case "Steel":
      return trny.steel_map;
    case "Wood":
      return trny.wood_map;
    default:
      console.log(`getTourneyMap() error: couldn't find a tourney map..`);
  }
}

function formatTime(time, verified = true) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time) - minutes * 60;
  const ms = parseInt((time % 1).toFixed(2) * 100);
  return `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}.${ms < 10 ? `0${ms}` : ms}${verified ? "" : " ❔"}`;
}

function getTimeSectionsArray(time) {
  const partRegex = /\d{1,2}/g;
  return time.match(partRegex);
}

function isValidTime(time) {
  const validRegex = /^((\d{0,2}):)?(\d{2}).(\d{2})$/g;
  return validRegex.test(time);
}

export { formatSteamURL, getTourneyMap, formatTime, getTimeSectionsArray, isValidTime };
