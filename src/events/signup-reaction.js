const { getPlayer, getActiveTourney, createTourneyPlayer, removeTourneyPlayer } = require("../lib/database.js");

function signupsReactionAdd(message, user) {
  const trny = getActiveTourney();
  const player = getPlayer(user.id);

  const division = trny.class === 'Soldier' ? player.soldier_division : player.demo_division;
  createTourneyPlayer(trny.id, player.id, division);
}

function signupsReactionRemove(message, user) {
  const trny = getActiveTourney();
  const player = getPlayer(user.id);
  removeTourneyPlayer(trny.id, player.id);
}

module.exports = {
  signupsReactionAdd,
  signupsReactionRemove
}