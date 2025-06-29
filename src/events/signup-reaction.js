import { getPlayer, getActiveTourney, createTourneyPlayer, removeTourneyPlayer, createPlayer } from "../lib/database.js";

function signupsReactionAdd(message, user) {
  const trny = getActiveTourney();
  const player = getPlayer(user.id) ?? createPlayer(user.id, user.displayName);
  if (trny && player) {
    const division_name = trny.class === 'Soldier' ? player.soldier_division : player.demo_division;
    createTourneyPlayer(trny.id, player.id, division_name);
  }
}

function signupsReactionRemove(message, user) {
  const trny = getActiveTourney();
  //createPlayer() shouldn't be called here unless syuvi is offline when a player signs up
  const player = getPlayer(user.id) ?? createPlayer(user.id, user.displayName);
  if (trny && player) {
    removeTourneyPlayer(trny.id, player.id);
  }
}

export {
  signupsReactionAdd,
  signupsReactionRemove
}