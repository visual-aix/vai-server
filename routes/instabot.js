import AUTOMATION from "../instabot/automation.js";

export default (app) => {
  app.get("/instabot/load", async function (req, res) {
    console.log("GET /instabot/load");
    const json = await AUTOMATION.load();
    return res.json(json);
  });
  app.get("/instabot/clean", async function (req, res) {
    console.log("GET /instabot/clean");
    const json = await AUTOMATION.removeFollowingThatNotFollow();
    return res.json(json);
  });
  app.get("/instabot/engage", async function (req, res) {
    console.log("GET /instabot/engage");
    const json = await AUTOMATION.startEngaging();
    return res.json(json);
  });
  app.get("/instabot/login", async function (req, res) {
    console.log("GET /instabot/login");
    const json = await AUTOMATION.login();
    return res.json(json);
  });
};
