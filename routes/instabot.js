import { join, dirname } from "path";
import { Low, JSONFile } from "lowdb";
import { fileURLToPath } from "url";
import axios from "axios";
import merge from "deepmerge-json";
import sleep from "sleep-promise";

const INSTAPI_PATH = "http://localhost:8001";

const dbFile = join(dirname(fileURLToPath(import.meta.url)), "../data/db.json");
console.log("Using db", dbFile);
const db = new Low(new JSONFile(dbFile));

await db.read();
if (db.data === null) {
  db.data = {};
  await db.write();
}

const credFile = join(
  dirname(fileURLToPath(import.meta.url)),
  "../data/credentials.json"
);

const cred = new Low(new JSONFile(credFile));
await cred.read();
if (cred.data === null) {
  cred.data = {};
  await cred.write();
} else {
  console.log("Loaded Instagram credentials from", credFile);
}
var sessionid = cred.data.sessionId;

const smartsleep = (start, end) =>
  sleep(1000 * (start + Math.random() * (end - start)));

const INSTAPI = {
  login: (username, password) =>
    axios
      .post(
        INSTAPI_PATH + "/auth/login",
        new URLSearchParams({ username, password })
      )
      .then(({ data }) => data),
  getUser: (username) =>
    axios
      .post(
        INSTAPI_PATH + "/user/info_by_username",
        new URLSearchParams({ sessionid, username })
      )
      .then(
        ({
          data: {
            pk,
            username,
            full_name,
            biography,
            category_name,
            follower_count,
            following_count,
            is_private,
          },
        }) => ({
          pk,
          username,
          full_name,
          biography,
          category_name,
          follower_count,
          following_count,
          is_private,
        })
      ),
  getFollowers: (user_id, use_cache = true) =>
    axios
      .post(
        INSTAPI_PATH + "/user/followers",
        new URLSearchParams({ sessionid, user_id, use_cache })
      )
      .then(({ data }) => data),
  getFollowing: (user_id, use_cache = true) =>
    axios
      .post(
        INSTAPI_PATH + "/user/following",
        new URLSearchParams({ sessionid, user_id, use_cache })
      )
      .then(({ data }) => data),
  unfollow: (user_id) =>
    axios
      .post(
        INSTAPI_PATH + "/user/unfollow",
        new URLSearchParams({ sessionid, user_id })
      )
      .then(({ data }) => data),
};

const AUTOMATION = {
  login: async () => {
    await cred.read();
    if (!(cred.data.username && cred.data.password))
      return res.json({
        message:
          "No instagram credentials found. Provide them in credentials.json",
      });

    if (!cred.data.sessionId) {
      try {
        const sessionId = await INSTAPI.login(
          cred.data.username,
          cred.data.password
        );
        console.log("Logged in instagram!");
        cred.data.sessionId = sessionId;
        sessionid = sessionId;
        await cred.write();
      } catch (err) {
        return { message: err.message };
      }
    }

    return { message: "OK" };
  },
  load: async () => {
    console.log("Getting user info, followers and followings...");
    var me = await INSTAPI.getUser(cred.data.username);
    db.data.me = me;

    var followers = await INSTAPI.getFollowers(db.data.me.pk, false);
    db.data.followers = Object.keys(followers);
    db.data.users = merge(db.data.users, followers);

    var following = await INSTAPI.getFollowing(db.data.me.pk, false);
    db.data.following = Object.keys(following);
    db.data.users = merge(db.data.users, following);
    await db.write();

    console.log(
      `Loaded ${db.data.followers.length} followers and ${db.data.following.length} following for ${me.username}`
    );

    return { message: "OK" };
  },
  removeFollowingThatNotFollow: async () => {
    await AUTOMATION.load();

    var notfollowingback = db.data.following.filter(
      (f) => db.data.followers.indexOf(f) === -1
    );
    db.data.notfollowingback = notfollowingback.concat();
    await db.write();

    //start unfollow
    console.log(
      notfollowingback.length + " not following back. Start unfollow."
    );
    for (const toUnfollow of notfollowingback) {
      const user = db.data.users[toUnfollow];
      if (
        cred.data.followingWhitelist &&
        cred.data.followingWhitelist.indexOf(user.username) > -1
      ) {
        console.log("Skipping", user.username);
        continue;
      }
      console.log("Unfollowing", user.username);

      await INSTAPI.unfollow(toUnfollow);

      db.data.notfollowingback.splice(
        db.data.notfollowingback.indexOf(toUnfollow),
        1
      );
      await db.write();
      await smartsleep(5, 30);
    }

    console.log("Cleaning completed");
    return {
      message: "OK",
    };
  },
  startEngaging: async () => {
    return { message: "Not implemented" };
  },
};

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

  app.get("/instabot", function (req, res) {
    console.log("GET /instabot");
    return res.json(db.data);
  });
};
