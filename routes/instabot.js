import { join, dirname } from "path";
import { Low, JSONFile } from "lowdb";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const file = join(__dirname, "../data/db.json");
console.log("Using", file);
const adapter = new JSONFile(file);
const db = new Low(adapter);

await db.read();

if (db.data === null) {
  db.data = {};
  await db.write();
}

export default (app) => {
  app.get("/instabot", function (req, res) {
    console.log("GET /instabot");

    return res.json(db.data);
  });
};
