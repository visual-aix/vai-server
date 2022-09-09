import fs from "fs";

export default (app) => {
  app.post("/sync-csv", function (req, res) {
    console.log("POST /sync-csv");

    const file = fs.createWriteStream(
      LOCAL_FOLDER + "templates\\variables.csv"
    );
    req.pipe(file);

    // after download completed close filestream
    file.on("finish", () => {
      file.close();
      console.log("Download Completed", file.path);
      return res.json({});
    });
  });
};
