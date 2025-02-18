const mongoose = require("mongoose");
const validator = require("validator");

/* create category schema */
const categorySchema = new mongoose.Schema(
  {
    // for title
    title: {
      type: String,
      required: [true, "Please, provide a category name"],
      trim: true,
      unique: [true, "Same category already exists"],
      maxLength: [100, "Your title would be at most 100 characters"],
    },

    // for description
    description: {
      type: String,
      required: [true, "Please, provide category description"],
      trim: true,
      maxLength: [500, "Your description would be at most 500 characters"],
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
    shopId: {
      type: String,
      require: true,
    },
    shop: {
      type: Object,
      require: true,
    },
    // for category time stamps
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

/* middleware for category */
categorySchema.pre("save", function (next) {
  // Capitalize title
  if (this.title) {
    this.title = this.title
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Automatically generate keynotes from title and description
  const keynotesArray = new Set();
  if (this.title) {
    keynotesArray.add(this.title);
  }
  if (this.description) {
    // Split description into words
    const descriptionKeywords = this.description.split(/[\s,]+/);
    descriptionKeywords.forEach((keyword) => keynotesArray.add(keyword.trim()));
  }

  // Convert Set to Array and assign to keynotes
  this.keynotes = Array.from(keynotesArray);

  // Replace space with hyphen and lowercase for tags
  this.tags = this.tags.map((tag) => tag.replace(/\s+/g, "-").toLowerCase());

  next();
});

/* create category model schema */
const Category = mongoose.model("Category", categorySchema);

/* export category schema */
module.exports = Category;
