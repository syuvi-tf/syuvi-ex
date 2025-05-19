const schedule = require('node-schedule');

// rename these
function createStartJob(datetime) {
  const date = new Date(datetime); // from sqlite datetime
  const job = schedule.scheduleJob(date, function () {
    console.log('tourney started');
  });
}

function createEndJob(datetime) {
  const date = new Date(datetime); // from sqlite datetime
  const job = schedule.scheduleJob(date, function () {
    console.log('tourney ended');
  });
}

module.exports = {
  createStartJob,
  createEndJob,
};