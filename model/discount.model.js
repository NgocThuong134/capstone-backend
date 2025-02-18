const mongoose = require("mongoose");

const discountSchema = mongoose.Schema({
  value: {
    type: Number,
    required: [true, "Please enter value of discount"],
  },
  unit: {
    type: String,
    required: [true, "Please enter unit of discount"],
    enum: ["percent", "amount"],
    default: "percent",
  },
  status: {
    type: Boolean,
    default: true,
  },
  startDate: {
    type: Date,
    required: [true, "Please enter start date of discount"],
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: [true, "Please enter end date of discount"],
    default: Date.now,
  },
});

const Discount = mongoose.model("Discount", discountSchema);
module.exports = Discount;
