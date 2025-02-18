const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const categoryNew = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter title of category new"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please enter description of category new"],
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
    // for keynotes
    keynotes: [
      {
        type: String,
        trim: true,
      },
    ],

    // for tags
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // for products
    news: [
      {
        type: ObjectId,
        ref: "New",
      },
    ],

    // for category  time stamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const CategoryNew = mongoose.model("CategoryNew", categoryNew);

module.exports = CategoryNew;
