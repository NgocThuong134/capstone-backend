const mongoose = require("mongoose");

const statusSchema = mongoose.Schema({
  nameStatus: {
    type: String,
    require: [true, "please enter status"],
  },
  description: {
    type: String,
    require: [true, "please enter description"],
  },
});

const Status = mongoose.model("Status", statusSchema);

module.exports = Status;
