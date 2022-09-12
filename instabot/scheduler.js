import schedule from "node-schedule";
import AUTOMATION from "./automation.js";
import { smartsleep } from "./utils.js";

const at10AM = "0 10 * * *";
const at9AM = "0 9 * * *";
const at4PM = "0 16 * * *";
const at9PM = "0 21 * * *";

const start = () => {
  console.log("Automation schedule started");
  schedule.scheduleJob(at10AM, async function () {
    console.log("------ Running schedule", at10AM, new Date().toDateString());
    await smartsleep(60 * 1, 60 * 50);
    await AUTOMATION.startEngaging();
  });

  schedule.scheduleJob(at4PM, async function () {
    console.log("------ Running schedule", at4PM, new Date().toDateString());
    await smartsleep(60 * 1, 60 * 50);
    await AUTOMATION.startEngaging();
  });

  schedule.scheduleJob(at9PM, async function () {
    console.log("------ Running schedule", at9PM, new Date().toDateString());
    await smartsleep(60 * 1, 60 * 50);
    await AUTOMATION.startEngaging();
  });

  schedule.scheduleJob(at9AM, async function () {
    console.log("------ Running schedule", at9AM, new Date().toDateString());
    await smartsleep(60 * 1, 60 * 50);
    await AUTOMATION.removeFollowingThatNotFollow();
  });
};

setTimeout(() => {
  start();
}, 1000);
