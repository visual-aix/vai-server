import AUTOMATION from "../instabot/automation.js";

export default (app) => {
  app.get("/instabot/load", async function (req, res) {
    console.log("GET /instabot/load");
    try {
      const json = await AUTOMATION.load(false);
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
      let json = {},
        engaged = 0;
      while (engaged < 10) {
        json = await AUTOMATION.startEngaging();
        if (json.engaged) {
          engaged += json.engaged;
        } else {
          break;
        }
      }

      console.log("====> follow total engaged", engaged);
      return res.json(json);
    } catch (ex) {
      console.error(ex);
      AUTOMATION.RUNNING.startEngaging = false;
      return res.json({ message: ex });
    }
  });
  app.get("/instabot/timeline", async function (req, res) {
    console.log("GET /instabot/timeline");
    try {
      let json = {},
        engaged = 0;
      while (engaged < 10) {
        json = await AUTOMATION.engageWithTimeline();
        if (json.engaged) {
          engaged += json.engaged;
        } else {
          break;
        }
      }

      console.log("====> timeline total engaged", engaged);
      return res.json(json);
    } catch (ex) {
      console.error(ex);
      AUTOMATION.RUNNING.engageWithTimeline = false;
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
