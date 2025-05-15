const schedule = require('node-schedule');

function createStartJob(datetime) {
  const date = new Date(datetime);
  const job = schedule.scheduleJob(date, function () {
    console.log('tourney started');
  });
}

function createEndJob(datetime) {
  const date = new Date(datetime);
  const job = schedule.scheduleJob(date, function () {
    console.log('tourney ended');
  });
}

module.exports = {
  createStartJob,
  createEndJob,
};