import schedule from "node-schedule";
import AUTOMATION from "./automation.js";
import { smartsleep } from "./utils.js";

const start = () => {
  console.log("Automation scheduled");

  ["0 12 * * *", "0 19 * * *"].forEach((sch) => {
    schedule.scheduleJob(sch, async function () {
      console.log("------ Running schedule", sch, new Date().toDateString());
      await smartsleep(0, 15 * 60);
      await AUTOMATION.startEngaging();
    });
  });
  [
    "0 10 * * *",
    "0 11 * * *",
    "0 12 * * *",
    "0 13 * * *",
    "0 14 * * *",
    "0 15 * * *",
    "0 16 * * *",
    "0 17 * * *",
    "0 18 * * *",
    "0 19 * * *",
    "0 20 * * *",
    "0 21 * * *",
    "0 22 * * *",
  ].forEach((sch) => {
    schedule.scheduleJob(sch, async function () {
      console.log("------ Running schedule", sch, new Date().toDateString());
      await smartsleep(0, 60);
      await AUTOMATION.engageWithTimeline();
    });
  });

  const at9AM = "0 9 * * *";
  schedule.scheduleJob(at9AM, async function () {
    console.log("------ Running schedule", at9AM, new Date().toDateString());
    await smartsleep(0, 60 * 10);
    await AUTOMATION.removeFollowingThatNotFollow();
  });
};

setTimeout(() => {
  start();
}, 1000);
