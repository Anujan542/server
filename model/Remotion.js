const mongoose = require("mongoose");

const RemotionSchema = new mongoose.Schema(
  {
    awardImage: {
      type: String,
    },
    logo: {
      type: String,
    },
    primaryColor: {
      type: String,
    },
    secondaryColor: {
      type: String,
    },
    secondLayerVideo: {
      type: String,
    },
    brandName: {
      type: String,
    },
    awardTitle: {
      type: String,
    },
    coachName: {
      type: String,
    },
    coachVideo: {
      type: String,
    },
    sideImage: {
      type: String,
    },
    studentFirstName: {
      type: String,
    },
    studentLastName: {
      type: String,
    },
    studentPosition: {
      type: String,
    },
    studentShirtNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Remotion", RemotionSchema);
