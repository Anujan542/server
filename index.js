const express = require("express");
const colors = require("colors");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

const {
  renderMediaOnLambda,
  getRenderProgress,
  renderStillOnLambda,
} = require("@remotion/lambda");

//model
const Remotion = require("./model/Remotion");
const { json } = require("express");

dotenv.config();
// connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/render", async function (req, res) {
  const eventId = req.query.eventId;

  const { data } = await axios.get(
    `https://clipping-platform-api-staging.azurewebsites.net/producer/remotion-preview/${eventId}`
  );

  //<----- Render Video On Lambda ---->
  const { bucketName, renderId, cloudWatchLogs } = await renderMediaOnLambda({
    region: "us-east-1",
    functionName: "remotion-render-3-3-1-mem2048mb-disk2048mb-900sec",
    composition: "HelloWorld",
    framesPerLambda: null,
    serveUrl:
      "https://remotionlambda-mym3rl12bp.s3.us-east-1.amazonaws.com/sites/classicMain/index.html",
    inputProps: { id: eventId },
    timeoutInMilliseconds: 1100000,
    codec: "h264",
    imageFormat: "jpeg",
    maxRetries: 1,
    privacy: "public",
    outName: {
      key: `${eventId}/${(Math.random() + 1).toString(36).substring(7)}.mp4`,
      bucketName: "remotionlambda-mym3rl12bp",
    },
  });

  //<----- Render still for Thumnail ---->
  const { estimatedPrice, url, sizeInBytes } = await renderStillOnLambda({
    region: "us-east-1",
    functionName: "remotion-render-3-3-1-mem2048mb-disk2048mb-900sec",
    serveUrl:
      "https://remotionlambda-mym3rl12bp.s3.us-east-1.amazonaws.com/sites/classicMain/index.html",
    composition: "HelloWorld",
    inputProps: { id: eventId },
    imageFormat: "jpeg",
    maxRetries: 1,
    privacy: "public",
    envVariables: {},
    frame: data.remotionPreviewData.thumnailTime,
    outName: {
      key: `${eventId}/sample6.jpeg`,
      bucketName: "remotionlambda-mym3rl12bp",
    },
  });

  console.log("Render Video", bucketName, renderId, cloudWatchLogs);
  console.log("Thumnail Details", estimatedPrice, url, sizeInBytes);

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const progress = await getRenderProgress({
      renderId: `${renderId}`,
      bucketName: `remotionlambda-mym3rl12bp`,
      functionName: "remotion-render-3-3-1-mem2048mb-disk2048mb-900sec",
      region: "us-east-1",
    });

    console.log((progress.overallProgress * 100).toFixed(0));

    if (progress.done) {
      console.log("Render finished!", progress.outputFile);
      console.log("Total Amount!", `$${progress.costs.displayCost}`);
      console.log(
        "Total Render Time in Minutes",
        Math.floor(progress.timeToFinish / 60000)
      );
      res.status(200).json({
        success: true,
        VideoUrl: progress.outputFile,
        Videocost: `$${progress.costs.displayCost}`,
        thumnailUrl: url,
        TotalRenderTimeInMinutes: Math.floor(progress.timeToFinish / 60000),
      });
      process.exit(0);
    }
    if (progress.fatalErrorEncountered) {
      console.error("Error enountered", progress.errors);
      process.exit(1);
    }
  }
});

if (process.env.NODE_ENV === "production") {
  app.get("/", (req, res) => {
    res.send("API is running....");
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is Not Running....");
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App is runing on port ${PORT}`.bgYellow.green.bold);
});
