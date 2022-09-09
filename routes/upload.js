import multer from "multer";

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

export default (app) => {
  app.post("/upload", upload.single("file"), function (req, res) {
    console.log("POST /upload");
    if (!req.file) throw "File not accepted";

    console.log("Uploaded ", req.file.originalname);

    return res.json({});
  });
};
