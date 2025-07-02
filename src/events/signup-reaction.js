import {
  getPlayer,
  getActiveTourney,
  createTourneyPlayer,
  removeTourneyPlayer,
  createPlayer,
} from "../lib/database.js";

async function signupsReactionAdd(message, user) {
  const tourney = getActiveTourney();
  let player = getPlayer(user.id);
  if (!player) {
    const member = await message.guild.members.fetch({ user: user.id, cache: false });

    // fallback to user id just in case
    player = member
      ? createPlayer(user.id, member.displayName)
      : createPlayer(user.id, user.displayName);
  }
  if (tourney && player) {
    const division_name =
      tourney.class === "Soldier" ? player.soldier_division : player.demo_division;
    createTourneyPlayer(tourney.id, player.id, division_name);
  }
}

function signupsReactionRemove(message, user) {
  const tourney = getActiveTourney();
  // createPlayer() shouldn't be called here unless syuvi is offline when a player signs up
  const player = getPlayer(user.id) ?? createPlayer(user.id, user.displayName);
  if (tourney && player) {
    removeTourneyPlayer(tourney.id, player.id);
  }
}

export { signupsReactionAdd, signupsReactionRemove };
