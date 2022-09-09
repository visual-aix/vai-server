import express from "express";
import cors from "cors";
import directory from "serve-index";
import multer from "multer";
import fs from "fs";
import commandLineArgs from "command-line-args";

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uf = req.query.folder || "uploads";
    const ufa = LOCAL_FOLDER + uf;

    if (!fs.existsSync(ufa)) {
      console.log("Creating folder ", uf);
      fs.mkdirSync(ufa);
    }

    const dirfiles = fs
      .readdirSync(ufa, { withFileTypes: true })
      .filter((item) => !item.isDirectory())
      .map((item) => item.name);

    var fn = 0;
    var ok = false;
    while (!ok) {
      fn++;
      if (dirfiles.indexOf(fn + ".png") === -1) {
        fn = fn + ".png";
        break;
      }
    }

    file.name = fn;

    cb(null, ufa);
  },
  filename: function (req, file, cb) {
    cb(null, file.name);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "image/png") return cb(null, false);
    if (file.originalname.indexOf(".png") > -1)
      file.originalname = file.originalname.replace(".png", "");

    file.extension = "png";
    return cb(null, true);
  },
});
app.post("/upload", upload.single("file"), function (req, res) {
  if (!req.file) throw "File not accepted";

  console.log("Uploaded ", req.file.originalname);

  return res.json({});
});
app.post("/sync-csv", function (req, res) {
  console.log("Sync CSV command received", req.body);

  const file = fs.createWriteStream(LOCAL_FOLDER + "templates\\variables.csv");
  req.pipe(file);

  // after download completed close filestream
  file.on("finish", () => {
    file.close();
    console.log("Download Completed", file.path);
    return res.json({});
  });
});

app.use("/", directory(LOCAL_FOLDER));
app.use("/", express.static(LOCAL_FOLDER));
app.listen(PORT);
