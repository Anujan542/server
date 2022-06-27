const express = require("express");
const colors = require("colors");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const expressAsyncHandler = require("express-async-handler");

const {
  downloadMedia,
  renderVideoOnLambda,
  getRenderProgress,
} = require("@remotion/lambda");

//model
const Remotion = require("./model/Remotion");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

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

app.get("/render", async function (req, res) {
  const { bucketName, renderId } = await renderVideoOnLambda({
    region: "us-east-1",
    functionName: "remotion-render-2022-06-14-mem2048mb-disk512mb-120sec",
    composition: "HelloWorld",
    framesPerLambda: 20,
    serveUrl:
      "https://remotionlambda-mym3rl12bp.s3.us-east-1.amazonaws.com/sites/xo2ta8z5t0/index.html",
    inputProps: {},
    codec: "h264-mkv",
    imageFormat: "jpeg",
    maxRetries: 1,
    privacy: "public",
  });
  console.log(bucketName, renderId);
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const progress = await getRenderProgress({
      renderId: `${renderId}`,
      bucketName: `${bucketName}`,
      functionName: "remotion-render-2022-06-14-mem2048mb-disk512mb-120sec",
      region: "us-east-1",
    });

    if (progress.done) {
      console.log("Render finished!", progress.outputFile);
      console.log(progress.overallProgress);
      res.status(200).json({
        success: true,
        data: progress.outputFile,
        cost: progress.costs.displayCost,
      });
    }
    if (progress.fatalErrorEncountered) {
      console.error("Error enountered", progress.errors);
    }
  }
});

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

if (process.env.NODE_ENV === "production") {
  app.get("/", (req, res) => {
    res.send("API is running....");
  });
} else {
  app.get("/", (req, res) => {
    res.send("Not Running....");
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App is runing on port ${PORT}`.bgYellow.green.bold);
});
