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
var user_id = db.data.me ? db.data.me.pk : "";

const smartsleep = (fromInSeconds, toInSeconds) =>
  sleep(1000 * randomBetween(fromInSeconds, toInSeconds));

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
  getSuggestions: (user_id) =>
    axios
      .post(
        INSTAPI_PATH + "/user/suggestions",
        new URLSearchParams({ sessionid, user_id })
      )
      .then(({ data }) => data),
  getUserMedia: (user_id, count = 15) =>
    axios
      .post(
        INSTAPI_PATH + "/media/user_medias",
        new URLSearchParams({ sessionid, user_id, amount: count })
      )
      .then(({ data }) => data),
  likeMedia: (media_id) =>
    axios
      .post(
        INSTAPI_PATH + "/media/like",
        new URLSearchParams({ sessionid, media_id })
      )
      .then(({ data }) => data),
  commentMedia: (media_id, message) =>
    axios
      .post(
        INSTAPI_PATH + "/media/comment",
        new URLSearchParams({ sessionid, media_id, message })
      )
      .then(({ data }) => data),
  followUser: (user_id) =>
    axios
      .post(
        INSTAPI_PATH + "/user/follow",
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
      console.log(index, "Engage with AI artist", user.username);
      await AUTOMATION.engageWithUser(user);
      await smartsleep(30, 120);
    }

    console.log("Finished engaging.");
    return { message: "Not implemented" };
  },
  engageWithUser: async (user) => {
    if (user.lastInteractedWith) {
      console.warn("> Already engaged with", user.username);
      return;
    }

    const medias = await INSTAPI.getUserMedia(user.pk, 20);

    const maxLikes = randomBetween(5, 10);
    const maxComments = randomBetween(1, 4);

    let likes = 0;
    let comments = 0;
    for (const media of medias) {
      if (likes < maxLikes) {
        await smartsleep(2, 10);
        await INSTAPI.likeMedia(media.id);
        likes++;
      }

      if (comments < maxComments) {
        await smartsleep(8, 30);
        var message = getRandomMessage(media.caption_text);
        console.log("> Comment", message);
        try {
          await INSTAPI.commentMedia(media.id, message);
        } catch (ex) {
          console.error(ex.message);
        }
        comments++;
      }
    }

    await INSTAPI.followUser(user.pk);
    console.log("> Followed", user.username);

    console.log("> Engaged with", likes, "likes and", comments, "comments");
    user.lastInteractedWith = Date.now();
    await db.write();
  },
};

//https://instagram-fonts.top/special-characters-emojis.php
const EMOJIS = [
  "🧡",
  "💚",
  "😍",
  "❤️",
  "❤️",
  "❤️",
  "❤",
  "💪",
  "👍",
  "👏",
  "🙌",
  "🙌",
  "🔥",
  "🔥",
  "🚀",
  "✨",
  "⭐",
  "💫",
];
const MESSAGES = [
  "Awesome",
  "Awesome!",
  "dope",
  "Gorgeous",
  "damn",
  "Nice",
  "Nice render",
  "Love it",
  "Impressive",
  "Love your work",
  "So beautiful",
  "Good job! Very nice",
  "Amazing artwork",
  "Well done",
  "Great job",
  "I love your style",
  "I like your style",
  "wow",
  "WOW",
  "",
];
const getRandomMessage = (caption) => {
  var emojis = "";
  var emax = randomBetween(0, 3);
  while (emax--) {
    emojis += EMOJIS[randomBetween(0, EMOJIS.length - 1)];
  }

  var msg = MESSAGES[randomBetween(0, MESSAGES.length - 1)];

  if (msg.indexOf("!") === -1) {
    if (Math.random() < 0.3) msg += "!";
  }

  if (Math.random() < 0.3) msg = msg.toLowerCase();

  var full_msg = msg + " " + emojis;
  full_msg = full_msg.trim();
  if (!full_msg) return "Awesome work";

  return full_msg.trim();
};

const ai_keywords = [
  "MidJourney",
  "Mid Journey",
  "StableDiffusion",
  "Stable Diffusion",
  "Dalle",
  "Dall-e",
  "Digital Art",
  "digital.art",
  "daydream",
];
const isAiArtUser = (user) => {
  if (user.full_name.indexOf("AI") > -1) return true;
  if (user.username.toLowerCase().indexOf("ai") > -1) return true;

  var name = user.full_name.toLowerCase();
  var uname = user.username.toLowerCase();
  for (let kw in ai_keywords) {
    if (name.indexOf(kw.toLowerCase()) > -1) return true;
    if (uname.indexOf(kw.toLowerCase()) > -1) return true;
  }

  if (user.biography) {
    if (user.biography.indexOf("AI") > -1) return true;

    var bio = user.biography.toLowerCase();
    for (let kw in ai_keywords) {
      if (bio.indexOf(kw.toLowerCase()) > -1) return true;
    }
  }

  return false;
};

const randomBetween = (min, max) => {
  return Math.floor(min + Math.random() * (max - min + 1));
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
