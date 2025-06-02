const { createPlayer, getPlayer, getActiveTourney, createTourneyPlayer, removeTourneyPlayer } = require("../lib/database.js");

function signupsReactionAdd(message, user) {
  const trny = getActiveTourney();
  let player = getPlayer(user.id);
  if (player === undefined) { // don't loop this, could be infinite if something is wrong
    createPlayer(user.id, user.displayName);
    player = getPlayer(user.id);
  }

  const division = trny.class === 'Soldier' ? player.soldier_division : player.demo_division;
  createTourneyPlayer(trny.id, player.id, division);
}

function signupsReactionRemove(message, user) {
  const trny = getActiveTourney();
  const player = getPlayer(user.id);
  console.log("removing signup for trny.id:" + trny.id + " player.id:" + player.id);
  removeTourneyPlayer(trny.id, player.id)
}

module.exports = {
  signupsReactionAdd,
  signupsReactionRemove
}