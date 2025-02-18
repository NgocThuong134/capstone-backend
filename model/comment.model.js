const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

/* create review schema */
const reviewSchema = new mongoose.Schema(
  {
    // for reviewer
    reviewer: {
      type: ObjectId,
      ref: "User",
    },

    // for product
    product: {
      type: ObjectId,
      ref: "Product",
    },

    // new
    new: {
      type: ObjectId,
      ref: "New",
    },
    // for rating
    rating: {
      type: Number,
      required: [true, "Please, provide a rating"],
      min: 1,
      max: 5,
    },

    // for comment
    comment: {
      type: String,
      required: [true, "Please, provide a comment"],
      maxLength: [200, "Your comment should be at most 200 characters"],
    },

    // like number
    likes: {
      type: Number,
      default: 0,
    },

    // dislike number
    dislikes: {
      type: Number,
      default: 0,
    },

    // status
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },

    // for user account time stamps
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

/* create review model */
const Comment = mongoose.model("Comment", reviewSchema);

/* export Review model */
module.exports = Comment;
