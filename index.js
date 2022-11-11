const express = require("express");
const colors = require("colors");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const expressAsyncHandler = require("express-async-handler");
const os = require("os");
const path = require("path");
const {
  downloadMedia,
  renderVideoOnLambda,
  getRenderProgress,
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
  const { bucketName, renderId } = await renderVideoOnLambda({
    region: "us-east-1",
    functionName: "remotion-render-3-2-40-mem2048mb-disk2048mb-120sec",
    composition: "HelloWorld",
    framesPerLambda: 20,
    serveUrl:
      "https://remotionlambda-mym3rl12bp.s3.us-east-1.amazonaws.com/sites/my21/index.html",
    inputProps: { id: "64ea388b-9a77-45f7-9f7c-037337944ac3" },
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
      functionName: "remotion-render-3-2-40-mem2048mb-disk2048mb-120sec",
      region: "us-east-1",
    });

    console.log((progress.overallProgress * 100).toFixed(0));

    if (progress.done) {
      console.log("Render finished!", progress.outputFile);
      res.status(200).json({
        success: true,
        data: progress.outputFile,
        cost: progress.costs.displayCost,
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
