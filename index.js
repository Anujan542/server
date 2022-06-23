const express = require("express");
const colors = require("colors");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const expressAsyncHandler = require("express-async-handler");

//model
const Remotion = require("./model/Remotion");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Remotion API");
});

app.get(
  "/api/getDetails",
  expressAsyncHandler(async (req, res) => {
    const remotion = await Remotion.find().limit(1).sort({ $natural: -1 });

    if (remotion) {
      res.status(200).json(remotion);
    } else {
      res.status(400).json({ message: "Not FOund" });
    }
  })
);

app.post(
  "/api/addDetails",
  expressAsyncHandler(async (req, res) => {
    const remotion = new Remotion({
      awardImage: req.body.awardImage,
      logo: req.body.logo,
      primaryColor: req.body.primaryColor,
      secondaryColor: req.body.secondaryColor,
      secondLayerVideo: req.body.secondLayerVideo,
      brandName: req.body.brandName,
      awardTitle: req.body.awardTitle,
      coachName: req.body.coachName,
      coachVideo: req.body.coachVideo,
      sideImage: req.body.sideImage,
      studentFirstName: req.body.studentFirstName,
      studentLastName: req.body.studentLastName,
      studentPosition: req.body.studentPosition,
      studentShirtNumber: req.body.studentShirtNumber,
    });

    await remotion.save();

    if (remotion) {
      res.status(200).json(remotion);
    } else {
      res.status(401).json({ message: "not found" });
    }
  })
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App is runing on port ${PORT}`.bgYellow.green.bold);
});
