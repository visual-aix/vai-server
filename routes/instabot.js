import { join, dirname } from "path";
import { Low, JSONFile } from "lowdb";
import { fileURLToPath } from "url";
import merge from "deepmerge-json";

import INSTAPI from "../instabot/api.js";
import { randomBetween, smartsleep } from "../instabot/utils.js";
import { getRandomComment } from "../instabot/comment.js";
import { isAiArtUser } from "../instabot/profile.js";

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
  if (cred.data.sessionId) INSTAPI.setSession(cred.data.sessionId);
  console.log("Loaded Instagram credentials from", credFile);
}

var user_id = db.data.me ? db.data.me.pk : "";

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
        INSTAPI.setSession(sessionId);
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
    user_id = db.data.me.pk;

    var followers = await INSTAPI.getFollowers(user_id, false);
    db.data.followers = Object.keys(followers);
    db.data.users = merge(db.data.users, followers);

    var following = await INSTAPI.getFollowing(user_id, false);
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
    var startAt = Date.now();
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

    console.log(
      "Cleaning completed in",
      (Date.now() - startAt) / 1000,
      "seconds"
    );
    return {
      message: "OK",
    };
  },
  startEngaging: async () => {
    const suggestions = await INSTAPI.getSuggestions(user_id);
    console.log("Got", suggestions.length, "suggestions");

    db.data.suggestions = suggestions.map((s) => s.pk);
    db.data.users = merge(
      db.data.users,
      Object.assign({}, ...suggestions.map((x) => ({ [x.pk]: x })))
    );
    await db.write();

    let index = 0;
    for (const user_pk of db.data.suggestions) {
      let user = db.data.users[user_pk];
      index++;

      if (!isAiArtUser(user)) {
        if (typeof user.biography === "undefined") {
          console.log("Get user biography", user.username);
          user = merge(user, await INSTAPI.getUser(user.username));
          db.data.users[user_pk] = user;
          await db.write();
          if (!isAiArtUser(user)) continue;
        }
        continue;
      }

      if (db.data.followers.indexOf(user_pk) > -1) {
        console.log("Already a follower", user.username);
        continue;
      }

      console.log(index, "Engage with AI artist", user.username);
      await AUTOMATION.engageWithUser(user);
      await smartsleep(30, 120);
    }

    console.log("Finished engaging.");
    return { message: "Not implemented" };
  },
  engageWithUser: async (user) => {
    if (user.lastInteractedWith) {
      console.warn(" > Already engaged with", user.username);
      return;
    }
    user.lastInteractedWith = Date.now();
    await db.write();

    let medias = await INSTAPI.getUserMedia(user.pk, 20);
    medias = medias.sort(() => (Math.random() > 0.5 ? 1 : -1));

    const maxLikes = randomBetween(5, 10);
    const maxComments = randomBetween(1, 3);

    let likes = 0;
    let comments = 0;
    for (const media of medias) {
      const suffix =
        "[" +
        (media.caption_text || "").substring(0, 30).split("\n").join(" ") +
        "]@" +
        user.username;
      let liked = false;
      if (likes < maxLikes) {
        await smartsleep(2, 7);
        console.log("❤️ ", suffix);
        await INSTAPI.likeMedia(media.id);
        liked = true;
        likes++;
      }

      if (liked && comments < maxComments) {
        await smartsleep(4, 20);
        var message = getRandomComment(media.caption_text);
        console.log("> ", message, suffix);
        try {
          await INSTAPI.commentMedia(media.id, message);
        } catch (ex) {
          console.error("ERROR", ex.message);
        }
        comments++;
      }
    }

    await smartsleep(1, 3);
    await INSTAPI.followUser(user.pk);
    console.log("👀", "Followed", user.username);

    user.followedAt = Date.now();
    await db.write();

    console.log(
      "➡️➡️➡️",
      likes,
      "likes |",
      comments,
      "comments @",
      user.username
    );
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
