import { join, dirname } from "path";
import { Low, JSONFile } from "lowdb";
import { fileURLToPath } from "url";
import axios from "axios";

const INSTAGRAM_API = "http://localhost:8001";

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

const INST = {
  login: (username, password) =>
    axios
      .post(
        INSTAGRAM_API + "/auth/login",
        new URLSearchParams({ username, password })
      )
      .catch((err) => {
        console.error("INST POST /auth/login", err.message);
        throw err;
      }),
};

export default (app) => {
  app.get("/instabot/login", async function (req, res) {
    console.log("GET /instabot/login");

    await cred.read();
    if (!(cred.data.username && cred.data.password))
      return res.json({
        message:
          "No instagram credentials found. Provide them in credentials.json",
      });

    if (!cred.data.sessionId) {
      try {
        const { data: sessionId } = await INST.login(
          cred.data.username,
          cred.data.password
        );
        console.log("Logged in instagram!");
        cred.data.sessionId = sessionId;
        await cred.write();
      } catch (err) {
        return res.json({ message: err.message });
      }
    }

    return res.json({ message: "OK" });
  });

  app.get("/instabot", function (req, res) {
    console.log("GET /instabot");

    return res.json(db.data);
  });
};
