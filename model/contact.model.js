const mongoose = require("mongoose");
const validator = require("validator");

const contactSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter the name of the establishment"],
  },
  address: {
    type: String,
    required: [true, "Please enter the address"],
  },
  phone: {
    type: String,
    required: [true, "Please enter the phone number"],
    validate: {
      validator: function (v) {
        return validator.isMobilePhone(v, "any", { strictMode: false });
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  email: {
    type: String,
    required: [true, "Please enter the email address"],
    validate: {
      validator: function (v) {
        return validator.isEmail(v);
      },
      message: (props) => `${props.value} is not a valid email address!`,
    },
  },
  website: {
    type: String,
    required: [false], // Không bắt buộc
    validate: {
      validator: function (v) {
        return validator.isURL(v);
      },
      message: (props) => `${props.value} is not a valid URL!`,
    },
  },
  logo: {
    type: String, // URL đến logo
    required: [false], // Không bắt buộc
    validate: {
      validator: function (v) {
        return validator.isURL(v);
      },
      message: (props) => `${props.value} is not a valid URL!`,
    },
  },
  banner: {
    type: String, // URL đến banner
    required: [false], // Không bắt buộc
    validate: {
      validator: function (v) {
        return validator.isURL(v);
      },
      message: (props) => `${props.value} is not a valid URL!`,
    },
  },
  openingHours: [
    {
      day: {
        type: String,
        enum: ["t2", "t3", "t4", "t5", "t6", "t7", "cn"], // Các ngày trong tuần
        required: true,
      },
      openHour: {
        type: String,
        required: true,
      },
      closeHour: {
        type: String,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
