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
      "https://remotionlambda-mym3rl12bp.s3.us-east-1.amazonaws.com/sites/eiwlgz4vx4/index.html",
    inputProps: {},
    codec: "h264-mkv",
    imageFormat: "jpeg",
    maxRetries: 1,
    privacy: "public",
  });
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const progress = await getRenderProgress({
      renderId: `${renderId}`,
      bucketName: `${bucketName}`,
      functionName: "remotion-render-2022-06-14-mem2048mb-disk512mb-120sec",
      region: "us-east-1",
    });
    if (progress.done) {
      console.log("Render finished!", progress.outputFile);
      res.status(200).json({ message: progress.outputFile });
      process.exit(0);
    }
    if (progress.fatalErrorEncountered) {
      console.error("Error enountered", progress.errors);
      process.exit(1);
    }
  }
});

// app.get("/download/:filename", async (req, res) => {
//   const filename = req.params.filename;
//   let x = await s3.getObject({ Bucket: BUCKET, Key: filename }).promise();
//   res.send(x.Body);
// });

// app.get("/download", async function (req, res) {
//   const { outputPath, sizeInBytes } = await downloadMedia({
//     bucketName: "remotionlambda-mym3rl12bp",
//     region: "us-east-1",
//     renderId: "ghhtbekokc",
//     outPath: "./test/pop.mp4",
//     onProgress: ({ progress }) => {
//       console.log(`(${(progress * 100).toFixed(0)}%)`);
//       // return progress;
//     },
//   });

//   // console.log(progress);
//   console.log(outputPath); // "/Users/yourname/remotion-project/out.mp4"
//   console.log(sizeInBytes);
// });

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
  app.use("/", express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client/build/index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running....");
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App is runing on port ${PORT}`.bgYellow.green.bold);
});
