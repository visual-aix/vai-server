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
