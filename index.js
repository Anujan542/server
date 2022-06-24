const express = require("express");
const colors = require("colors");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const expressAsyncHandler = require("express-async-handler");
const os = require("os");
const path = require("path");
const { downloadMedia, renderVideoOnLambda } = require("@remotion/lambda");

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

app.get("/download", async function (req, res) {
  const { outputPath, sizeInBytes } = await downloadMedia({
    bucketName: "remotionlambda-mym3rl12bp",
    region: "us-east-1",
    renderId: "ghhtbekokc",
    outPath: "out.mp4",
    onProgress: ({ totalSize, downloaded, progress }) => {
      console.log(
        `Download progress: ${totalSize}/${downloaded} bytes (${(
          progress * 100
        ).toFixed(0)}%)`
      );
    },
  });

  console.log(outputPath); // "/Users/yourname/remotion-project/out.mp4"
  console.log(sizeInBytes);
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

// const downloadVideo = async (req, res) => {
//   const { outputPath, sizeInBytes } = await downloadMedia({
//     bucketName: "remotionlambda-mym3rl12bp",
//     region: "us-east-1",
//     renderId: "ghhtbekokc",
//     outPath: "out.mp4",
//     onProgress: ({ totalSize, downloaded, progress }) => {
//       console.log(
//         `Download progress: ${totalSize}/${downloaded} bytes (${(
//           progress * 100
//         ).toFixed(0)}%)`
//       );
//     },
//   });

//   console.log(outputPath); // "/Users/yourname/remotion-project/out.mp4"
//   console.log(sizeInBytes);
// };

const renderVideo = async (req, res) => {
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

  console.log(bucketName); //remotionlambda-mym3rl12bp
  console.log(renderId); //32b9hr05kg
  // const { outputPath, sizeInBytes } = await downloadMedia({
  //   bucketName: "remotionlambda-mym3rl12bp",remotionlambda-mym3rl12bp
  //   region: "us-east-1",
  //   renderId: "74b4bpgtni",
  //   outPath: `${Test}`, //`${path.join(os.homedir(), "Desktop")}\\out.mp4`, //"out.mp4",
  //   onProgress: ({ totalSize, downloaded, progress }) => {
  //     console.log(
  //       `Download progress: ${totalSize}/${downloaded} bytes (${(
  //         progress * 100
  //       ).toFixed(0)}%)`
  //     );
  //   },
  // });

  // console.log(outputPath); // "/Users/yourname/remotion-project/out.mp4"
  // console.log(sizeInBytes);
};

// app.get("/render", renderVideo);

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
