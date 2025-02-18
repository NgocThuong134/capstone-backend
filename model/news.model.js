const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const newSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter name news"],
    trim: true,
  },
  title: {
    type: String,
    required: [true, "Please enter title news"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["published", "draft"],
    default: "draft",
  },
  // for thumbnail
  thumbnail: {
    url: {
      type: String,
      validate: [validator.isURL, "Please provide a valid thumbnail URL"],
      default: "https://placehold.co/296x200.png",
    },
    public_id: {
      type: String,
      default: "N/A",
    },
  },
  // for images
  images: [
    {
      url: {
        type: String,
        validate: [validator.isURL, "Please provide a valid image URL"],
        default: "https://placehold.co/296x200.png",
      },
      public_id: {
        type: String,
        default: "N/A",
      },
    },
  ],
  // for videos
  videos: [
    {
      url: {
        type: String,
        validate: [validator.isURL, "Please provide a valid video URL"],
        default: "https://placehold.co/296x200.png",
      },
      public_id: {
        type: String,
        default: "N/A",
      },
    },
  ],
  // context
  context: {
    type: String,
    default: "N/A",
  },
  // views
  views: {
    type: Number,
    default: 0,
  },
  // likes
  likes: {
    type: Number,
    default: 0,
  },
  // dislikes
  dislikes: {
    type: Number,
    default: 0,
  },
  // comments
  comments: [
    {
      type: ObjectId,
      ref: "Comment",
    },
  ],
  // category
  category: {
    type: ObjectId,
    ref: "CategoryNew",
  },
  // creatAT
  creatAT: {
    type: Date,
    default: Date.now,
  },
  // updateAt
  updateAt: {
    type: Date,
    default: Date.now,
  },
});

const New = mongoose.model("New", newSchema);

module.exports = New;
