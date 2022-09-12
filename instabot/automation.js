import { join, dirname } from "path";
import { Low, JSONFile } from "lowdb";
import { fileURLToPath } from "url";
import merge from "deepmerge-json";
import moment from "moment";

import { randomBetween, smartsleep } from "./utils.js";
import { getComment } from "./comment.js";
import { isAiArtUser } from "./profile.js";
import INSTAPI from "./api.js";

//--- BOOTSTRAP
const dbFile = join(dirname(fileURLToPath(import.meta.url)), "../data/db.json");
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

  setTimeout(() => {
    console.log("Loaded Instagram credentials");
  }, 500);
}

var user_id = db.data.me ? db.data.me.pk : "";
//--- BOOTSTRAP

const RUNNING = {
  removeFollowingThatNotFollow: false,
  startEngaging: false,
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
        INSTAPI.setSession(sessionId);
        await cred.write();
      } catch (err) {
        return { message: err.message };
      }
    }

    return { message: "OK" };
  },
  load: async () => {
    console.log("Refreshing followers and following...");
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
      `Loaded`,
      db.data.followers.length,
      "followers and",
      db.data.following.length,
      "following for",
      me.username
    );

    return { message: "OK" };
  },
  removeFollowingThatNotFollow: async () => {
    if (RUNNING.removeFollowingThatNotFollow) {
      console.warn("removeFollowingThatNotFollow already running. Skipped");
      return { message: "Already running" };
    }

    RUNNING.removeFollowingThatNotFollow = true;
    await AUTOMATION.load();

    var notfollowingback = db.data.following.filter(
      (f) => db.data.followers.indexOf(f) === -1
    );
    db.data.notfollowingback = notfollowingback.concat();
    await db.write();

    console.log(
      db.data.followers.length - notfollowingback.length,
      "/",
      db.data.followers.length,
      "follow you and you're not following back."
    );
    console.log(
      db.data.following.length - notfollowingback.length,
      "/",
      db.data.following.length,
      "you follow and they follow back."
    );
    //start unfollow
    const startAt = Date.now();
    console.log(
      notfollowingback.length,
      "/",
      db.data.following.length,
      "you follow but they are not following back. Check unfollow."
    );

    let index = 0;
    for (const toUnfollow of notfollowingback) {
      index++;
      await smartsleep(0, 1);
      const user = db.data.users[toUnfollow];
      if (
        cred.data.followingWhitelist &&
        cred.data.followingWhitelist.indexOf(user.username) > -1
      ) {
        console.log(index, "Skipping (whitelist)", user.username);
        continue;
      }

      if (!user.followedAt) {
        user.followedAt = 1662798978597; //10 sept 2022
      }

      var followedSince = moment(user.followedAt);
      if (moment().diff(followedSince, "days") < 3) {
        console.log(
          index,
          `Skipping (${followedSince.fromNow()})`,
          user.username
        );
        continue;
      }

      console.log(index, "Unfollowing", user.username);

      await INSTAPI.unfollow(toUnfollow);

      db.data.notfollowingback.splice(
        db.data.notfollowingback.indexOf(toUnfollow),
        1
      );
      await db.write();
      await smartsleep(30, 90);
    }

    console.log(
      `[${moment().format()}] `,
      "Cleaning completed in",
      moment(startAt).fromNow(true)
    );

    RUNNING.removeFollowingThatNotFollow = false;
    await AUTOMATION.load();

    return {
      message: "OK",
    };
  },
  startEngaging: async () => {
    if (RUNNING.startEngaging) {
      console.warn("startEngaging already running. Skipped");
      return { message: "Already running" };
    }

    const startAt = Date.now();
    RUNNING.startEngaging = true;

    await AUTOMATION.load();

    const suggestions = await INSTAPI.getSuggestions(user_id);
    console.log("Got", suggestions.length, "suggestions");

    db.data.suggestions = suggestions.map((s) => s.pk);
    db.data.users = merge(
      db.data.users,
      Object.assign({}, ...suggestions.map((x) => ({ [x.pk]: x })))
    );
    await db.write();

    let index = 0,
      engagedCount = 0;
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
      const engaged = await AUTOMATION.engageWithUser(user);
      if (engaged) {
        await smartsleep(30, 5 * 60);
        engagedCount++;
      }
    }

    console.log(
      `[${moment().format()}] `,
      "Finished engaging with",
      engagedCount,
      "in",
      moment(startAt).fromNow(true)
    );
    RUNNING.startEngaging = false;
    return { message: "OK" };
  },
  engageWithUser: async (user) => {
    if (user.lastInteractedWith) {
      console.warn(" > Already engaged with", user.username);
      return false;
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
        "]";
      let liked = false;
      if (likes < maxLikes) {
        await smartsleep(2, 7);
        console.log("❤️ ", suffix);
        await INSTAPI.likeMedia(media.id);
        liked = true;
        likes++;
      }

      const hasComments = media.comment_count > 0;
      if (liked && hasComments && comments < maxComments) {
        await smartsleep(4, 20);
        var message = getComment(user.username, media.caption_text);
        console.log(message, suffix);
        try {
          await INSTAPI.commentMedia(media.id, message);
        } catch (ex) {
          console.error("ERROR", ex.message);
        }
        comments++;
      }
    }

    if (likes > 0) {
      await smartsleep(1, 3);
      await INSTAPI.followUser(user.pk);
      console.log("👀", "Followed", user.username);
      user.followedAt = Date.now();
    }

    await db.write();

    console.log(
      "---->",
      likes,
      "likes |",
      comments,
      "comments |",
      user.username,
      "| took",
      moment(user.lastInteractedWith).fromNow(true)
    );

    return true;
  },
};

export default AUTOMATION;
