import schedule from "node-schedule";
import AUTOMATION from "./automation.js";

const at8AM = "0 8 * * *";
const at11AM = "0 11 * * *";
const at4PM = "0 16 * * *";
const at9PM = "0 21 * * *";

const start = () => {
  console.log("Automation scheduled");
  schedule.scheduleJob(at8AM, async function () {
    await AUTOMATION.startEngaging();
  });

  schedule.scheduleJob(at4PM, async function () {
    await AUTOMATION.startEngaging();
  });

  schedule.scheduleJob(at9PM, async function () {
    await AUTOMATION.startEngaging();
  });

  schedule.scheduleJob(at11AM, async function () {
    await AUTOMATION.removeFollowingThatNotFollow();
  });
};

setTimeout(() => {
  start();
}, 1000);
