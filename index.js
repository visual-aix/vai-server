import express from "express";
import cors from "cors";
import directory from "serve-index";
import commandLineArgs from "command-line-args";

import uploader from "./routes/upload.js";
import syncCSV from "./routes/sync-csv.js";
import instabot from "./routes/instabot.js";
import "./instabot/scheduler.js";

const options = commandLineArgs([
  { name: "port", alias: "p", type: Number, defaultValue: 8088 },
  {
    name: "serve",
    alias: "s",
    type: String,
    defaultValue: "D:\\Design\\ig\\challenges\\",
    defaultOption: true,
  },
]);

const LOCAL_FOLDER = options.serve;
const PORT = options.port;

console.log("Listening on port " + PORT);
console.log("Serve " + LOCAL_FOLDER);

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

uploader(LOCAL_FOLDER, app);
syncCSV(LOCAL_FOLDER, app);
instabot(app);

app.use("/", directory(LOCAL_FOLDER));
app.use("/", express.static(LOCAL_FOLDER));
app.listen(PORT);
