import AUTOMATION from "../instabot/automation.js";

export default (app) => {
  app.get("/instabot/load", async function (req, res) {
    console.log("GET /instabot/load");
    try {
      const json = await AUTOMATION.load();
      return res.json(json);
    } catch (ex) {
      console.error(ex);
      return res.json({ message: ex });
    }
  });
  app.get("/instabot/clean", async function (req, res) {
    console.log("GET /instabot/clean");
    try {
      const json = await AUTOMATION.removeFollowingThatNotFollow();
      return res.json(json);
    } catch (ex) {
      console.error(ex);
      AUTOMATION.RUNNING.removeFollowingThatNotFollow = false;
      return res.json({ message: ex });
    }
  });
  app.get("/instabot/engage", async function (req, res) {
    console.log("GET /instabot/engage");
    try {
      const json = await AUTOMATION.startEngaging();
      return res.json(json);
    } catch (ex) {
      console.error(ex);
      AUTOMATION.RUNNING.startEngaging = false;
      return res.json({ message: ex });
    }
  });
  app.get("/instabot/login", async function (req, res) {
    try {
      console.log("GET /instabot/login");
      const json = await AUTOMATION.login();
      return res.json(json);
    } catch (ex) {
      console.error(ex);
      return res.json({ message: ex });
    }
  });
};
