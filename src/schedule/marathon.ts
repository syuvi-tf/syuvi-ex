import Schedule from 'node-schedule';

function test() {
  const routine = Schedule.scheduleJob('test routine', '*/30 * * * * *', async function () {
    console.log(`[TEST] ${routine.name} ran in src/schedule/marathon.ts`);
  });
}

export { test };
